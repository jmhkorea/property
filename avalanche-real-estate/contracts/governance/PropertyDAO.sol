// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title PropertyDAO
 * @dev 부동산 자산 관리를 위한 DAO 거버넌스 컨트랙트
 * 토큰화된 부동산의 중요 결정사항을 투표로 결정
 */
contract PropertyDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // 이벤트 정의
    event PropertyProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed propertyId,
        address proposer,
        string description
    );

    // 부동산 ID별 진행 중인 제안
    mapping(uint256 => uint256[]) private _propertyProposals;

    /**
     * @dev 생성자
     * @param _token 투표 토큰 컨트랙트 주소
     * @param _timelock 타임락 컨트랙트 주소
     */
    constructor(IVotes _token, TimelockController _timelock)
        Governor("PropertyDAO")
        GovernorSettings(
            1 days, /* 제안 투표 시작까지의 지연 시간 */
            7 days, /* 제안 투표 기간 */
            100e18  /* 제안을 위한 최소 토큰 보유량 */
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) /* 투표 쿼럼 비율 (4%) */
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @dev 특정 부동산에 대한 제안 생성
     * @param propertyId 부동산 ID
     * @param targets 호출할 컨트랙트 주소 배열
     * @param values 각 호출에 보낼 이더 값 배열
     * @param calldatas 각 호출의 함수 호출 데이터 배열
     * @param description 제안 설명
     * @return 생성된 제안 ID
     */
    function proposeForProperty(
        uint256 propertyId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        // 부동산별 제안 목록에 추가
        _propertyProposals[propertyId].push(proposalId);
        
        emit PropertyProposalCreated(proposalId, propertyId, msg.sender, description);
        
        return proposalId;
    }

    /**
     * @dev 특정 부동산의 모든 제안 목록 조회
     * @param propertyId 부동산 ID
     * @return 해당 부동산의 제안 ID 배열
     */
    function getPropertyProposals(uint256 propertyId) public view returns (uint256[] memory) {
        return _propertyProposals[propertyId];
    }

    /**
     * @dev 현재 투표 중인 제안 확인
     * @param proposalId 제안 ID
     * @return 투표 중 여부
     */
    function isProposalActive(uint256 proposalId) public view returns (bool) {
        return _state(proposalId) == ProposalState.Active;
    }

    // 필수 오버라이드 함수 구현
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 