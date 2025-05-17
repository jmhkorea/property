// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IFractionalOwnership.sol";

/**
 * @title PropertyGovernance
 * @dev 토큰화된 부동산에 대한 거버넌스 컨트랙트
 * 지분 소유자들이 부동산 관련 의사결정에 투표할 수 있는 기능 제공
 */
contract PropertyGovernance is Ownable, ReentrancyGuard {
    // 분할 소유권 컨트랙트 인터페이스
    IFractionalOwnership public fractionalOwnership;
    
    // 제안 상태 열거형
    enum ProposalState {
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Executed
    }
    
    // 투표 유형 열거형
    enum VoteType {
        Against,
        For,
        Abstain
    }
    
    // 제안 유형 열거형
    enum ProposalType {
        PropertyUpgrade,    // 부동산 개선/보수
        RentalTermsChange,  // 임대 조건 변경
        PropertySale,       // 부동산 매각
        FundsAllocation,    // 자금 할당
        Other               // 기타
    }
    
    // 제안 정보 구조체
    struct Proposal {
        uint256 id;                      // 제안 ID
        uint256 shareId;                 // 부동산 지분 ID
        address proposer;                // 제안자
        string title;                    // 제목
        string description;              // 설명
        uint256 startTime;               // 시작 시간
        uint256 endTime;                 // 종료 시간
        uint256 forVotes;                // 찬성 투표 수
        uint256 againstVotes;            // 반대 투표 수
        uint256 abstainVotes;            // 기권 투표 수
        bool executed;                   // 실행 여부
        bool canceled;                   // 취소 여부
        ProposalType proposalType;       // 제안 유형
        mapping(address => Receipt) receipts; // 투표 영수증
    }
    
    // 투표 영수증 구조체
    struct Receipt {
        bool hasVoted;                   // 투표 여부
        VoteType support;                // 투표 유형
        uint256 votes;                   // 투표 수
    }
    
    // 제안 조회용 구조체 (매핑 제외)
    struct ProposalView {
        uint256 id;
        uint256 shareId;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        ProposalType proposalType;
    }
    
    // 제안 카운터
    uint256 private _proposalCount;
    
    // 제안 ID별 제안 정보 매핑
    mapping(uint256 => Proposal) private _proposals;
    
    // 지분 ID별 제안 ID 목록 매핑
    mapping(uint256 => uint256[]) private _shareProposals;
    
    // 투표 설정
    uint256 public votingDelay = 1 days;    // 제안 생성 후 투표 시작까지 지연 시간
    uint256 public votingPeriod = 7 days;   // 투표 기간
    uint256 public proposalThreshold = 5;   // 제안을 생성하기 위한 최소 지분 수 (%)
    uint256 public quorumVotes = 30;        // 제안이 통과되기 위한 최소 투표율 (%)
    
    // 이벤트 정의
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed shareId,
        address indexed proposer,
        string title,
        ProposalType proposalType,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType support,
        uint256 votes
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    
    /**
     * @dev 생성자
     * @param _fractionalOwnership 분할 소유권 컨트랙트 주소
     */
    constructor(address _fractionalOwnership) {
        fractionalOwnership = IFractionalOwnership(_fractionalOwnership);
    }
    
    /**
     * @dev 제안 생성
     * @param _shareId 부동산 지분 ID
     * @param _title 제안 제목
     * @param _description 제안 설명
     * @param _proposalType 제안 유형
     * @return 생성된 제안 ID
     */
    function createProposal(
        uint256 _shareId,
        string memory _title,
        string memory _description,
        ProposalType _proposalType
    ) external nonReentrant returns (uint256) {
        // 지분 정보 가져오기
        IFractionalOwnership.ShareInfo memory shareInfo = fractionalOwnership.getShareInfo(_shareId);
        require(shareInfo.active, "PropertyGovernance: share is not active");
        
        // 사용자의 지분 잔액 확인
        uint256 balance = IERC1155(address(fractionalOwnership)).balanceOf(msg.sender, _shareId);
        
        // 제안을 생성하기 위한 충분한 지분 보유 여부 확인
        uint256 requiredShares = (shareInfo.totalShares * proposalThreshold) / 100;
        require(balance >= requiredShares, "PropertyGovernance: not enough shares to create proposal");
        
        // 제안 ID 생성
        _proposalCount++;
        uint256 proposalId = _proposalCount;
        
        // 시작 및 종료 시간 계산
        uint256 startTime = block.timestamp + votingDelay;
        uint256 endTime = startTime + votingPeriod;
        
        // 제안 정보 생성
        Proposal storage newProposal = _proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.shareId = _shareId;
        newProposal.proposer = msg.sender;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.startTime = startTime;
        newProposal.endTime = endTime;
        newProposal.proposalType = _proposalType;
        
        // 지분 ID별 제안 목록 업데이트
        _shareProposals[_shareId].push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            _shareId,
            msg.sender,
            _title,
            _proposalType,
            startTime,
            endTime
        );
        
        return proposalId;
    }
    
    /**
     * @dev 제안에 투표
     * @param _proposalId 제안 ID
     * @param _support 투표 유형
     */
    function castVote(uint256 _proposalId, VoteType _support) external nonReentrant {
        require(_proposalExists(_proposalId), "PropertyGovernance: proposal does not exist");
        
        Proposal storage proposal = _proposals[_proposalId];
        
        // 투표 가능 상태 확인
        ProposalState proposalState = state(_proposalId);
        require(proposalState == ProposalState.Active, "PropertyGovernance: proposal not active");
        
        // 이미 투표했는지 확인
        Receipt storage receipt = proposal.receipts[msg.sender];
        require(!receipt.hasVoted, "PropertyGovernance: already voted");
        
        // 사용자의 지분 잔액 확인
        uint256 balance = IERC1155(address(fractionalOwnership)).balanceOf(msg.sender, proposal.shareId);
        require(balance > 0, "PropertyGovernance: no shares owned");
        
        // 투표 정보 업데이트
        receipt.hasVoted = true;
        receipt.support = _support;
        receipt.votes = balance;
        
        // 투표 집계 업데이트
        if (_support == VoteType.For) {
            proposal.forVotes += balance;
        } else if (_support == VoteType.Against) {
            proposal.againstVotes += balance;
        } else {
            proposal.abstainVotes += balance;
        }
        
        emit VoteCast(msg.sender, _proposalId, _support, balance);
    }
    
    /**
     * @dev 제안 실행 (제안이 성공한 경우)
     * @param _proposalId 제안 ID
     */
    function executeProposal(uint256 _proposalId) external nonReentrant {
        require(_proposalExists(_proposalId), "PropertyGovernance: proposal does not exist");
        
        Proposal storage proposal = _proposals[_proposalId];
        
        // 제안 상태 확인
        ProposalState proposalState = state(_proposalId);
        require(proposalState == ProposalState.Succeeded, "PropertyGovernance: proposal not succeeded");
        
        // 제안 실행 처리
        proposal.executed = true;
        
        emit ProposalExecuted(_proposalId);
    }
    
    /**
     * @dev 제안 취소 (제안자만 가능)
     * @param _proposalId 제안 ID
     */
    function cancelProposal(uint256 _proposalId) external nonReentrant {
        require(_proposalExists(_proposalId), "PropertyGovernance: proposal does not exist");
        
        Proposal storage proposal = _proposals[_proposalId];
        
        // 제안자 또는 관리자만 취소 가능
        require(
            proposal.proposer == msg.sender || owner() == msg.sender,
            "PropertyGovernance: not proposer or owner"
        );
        
        // 제안 상태 확인
        ProposalState proposalState = state(_proposalId);
        require(
            proposalState == ProposalState.Active,
            "PropertyGovernance: proposal not active"
        );
        
        // 제안 취소 처리
        proposal.canceled = true;
        
        emit ProposalCanceled(_proposalId);
    }
    
    /**
     * @dev 제안 상태 조회
     * @param _proposalId 제안 ID
     * @return 제안 상태
     */
    function state(uint256 _proposalId) public view returns (ProposalState) {
        require(_proposalExists(_proposalId), "PropertyGovernance: proposal does not exist");
        
        Proposal storage proposal = _proposals[_proposalId];
        
        if (proposal.canceled) {
            return ProposalState.Canceled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp <= proposal.startTime) {
            return ProposalState.Active;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        
        // 지분 정보 가져오기
        IFractionalOwnership.ShareInfo memory shareInfo = fractionalOwnership.getShareInfo(proposal.shareId);
        
        // 정족수 계산
        uint256 requiredVotes = (shareInfo.totalShares * quorumVotes) / 100;
        
        // 투표 결과 판단
        if (proposal.forVotes + proposal.againstVotes + proposal.abstainVotes < requiredVotes) {
            return ProposalState.Defeated; // 정족수 미달
        }
        
        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }
    
    /**
     * @dev 투표 설정 업데이트 (오너만 호출 가능)
     * @param _votingDelay 투표 지연 시간 (초)
     * @param _votingPeriod 투표 기간 (초)
     * @param _proposalThreshold 제안 임계값 (%)
     * @param _quorumVotes 정족수 (%)
     */
    function updateVotingParams(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumVotes
    ) external onlyOwner {
        // 유효성 검사
        require(_proposalThreshold <= 100, "PropertyGovernance: invalid proposal threshold");
        require(_quorumVotes <= 100, "PropertyGovernance: invalid quorum votes");
        
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
    }
    
    /**
     * @dev 제안 정보 조회
     * @param _proposalId 제안 ID
     * @return 제안 정보
     */
    function getProposal(uint256 _proposalId) external view returns (ProposalView memory) {
        require(_proposalExists(_proposalId), "PropertyGovernance: proposal does not exist");
        
        Proposal storage proposal = _proposals[_proposalId];
        
        return ProposalView({
            id: proposal.id,
            shareId: proposal.shareId,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            executed: proposal.executed,
            canceled: proposal.canceled,
            proposalType: proposal.proposalType
        });
    }
    
    /**
     * @dev 제안에 대한 유저의 투표 정보 조회
     * @param _proposalId 제안 ID
     * @param _voter 투표자 주소
     * @return hasVoted 투표 여부
     * @return support 투표 유형
     * @return votes 투표 수
     */
    function getReceipt(uint256 _proposalId, address _voter) external view returns (
        bool hasVoted,
        VoteType support,
        uint256 votes
    ) {
        require(_proposalExists(_proposalId), "PropertyGovernance: proposal does not exist");
        
        Receipt memory receipt = _proposals[_proposalId].receipts[_voter];
        return (receipt.hasVoted, receipt.support, receipt.votes);
    }
    
    /**
     * @dev 특정 지분 ID에 대한 모든 제안 ID 조회
     * @param _shareId 지분 ID
     * @return 제안 ID 배열
     */
    function getProposalsByShareId(uint256 _shareId) external view returns (uint256[] memory) {
        return _shareProposals[_shareId];
    }
    
    /**
     * @dev 내부 함수: 제안이 존재하는지 확인
     * @param _proposalId 제안 ID
     * @return 존재 여부
     */
    function _proposalExists(uint256 _proposalId) internal view returns (bool) {
        return _proposalId > 0 && _proposalId <= _proposalCount;
    }
} 