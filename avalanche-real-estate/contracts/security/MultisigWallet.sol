// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultisigWallet
 * @dev 부동산 토큰화 플랫폼을 위한 다중 서명 지갑
 */
contract MultisigWallet is ReentrancyGuard {
    // 이벤트 정의
    event Deposit(address indexed sender, uint256 amount);
    event SubmitTransaction(address indexed owner, uint256 indexed txIndex, address indexed to, uint256 value, bytes data);
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint256 required);
    
    // 트랜잭션 구조체
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }
    
    // 소유자 목록
    address[] public owners;
    mapping(address => bool) public isOwner;
    
    // 필요한 승인 수
    uint256 public numConfirmationsRequired;
    
    // 트랜잭션 목록
    Transaction[] public transactions;
    
    // 트랜잭션별 확인 상태
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    
    // 대기 중인 트랜잭션 수
    uint256 public pendingTransactions;
    
    /**
     * @dev 생성자
     * @param _owners 초기 소유자 주소 배열
     * @param _numConfirmationsRequired 필요한 승인 수
     */
    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "MultisigWallet: owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "MultisigWallet: invalid number of required confirmations"
        );
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            
            require(owner != address(0), "MultisigWallet: null address");
            require(!isOwner[owner], "MultisigWallet: owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        numConfirmationsRequired = _numConfirmationsRequired;
    }
    
    /**
     * @dev 이더 수신 시 호출되는 fallback 함수
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev 새 트랜잭션 제출
     * @param _to 수신자 주소
     * @param _value 전송할 이더 양
     * @param _data 트랜잭션 데이터
     * @return 생성된 트랜잭션 인덱스
     */
    function submitTransaction(address _to, uint256 _value, bytes memory _data) 
        public
        onlyOwner
        returns (uint256)
    {
        uint256 txIndex = transactions.length;
        
        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );
        
        pendingTransactions++;
        
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        
        // 트랜잭션 생성자는 자동으로 승인
        confirmTransaction(txIndex);
        
        return txIndex;
    }
    
    /**
     * @dev 트랜잭션 승인
     * @param _txIndex 트랜잭션 인덱스
     */
    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;
        
        emit ConfirmTransaction(msg.sender, _txIndex);
        
        // 충분한 확인을 받으면 자동으로 실행
        if (transaction.numConfirmations >= numConfirmationsRequired) {
            executeTransaction(_txIndex);
        }
    }
    
    /**
     * @dev 트랜잭션 실행
     * @param _txIndex 트랜잭션 인덱스
     */
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        
        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "MultisigWallet: not enough confirmations"
        );
        
        transaction.executed = true;
        pendingTransactions--;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "MultisigWallet: transaction failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }
    
    /**
     * @dev 트랜잭션 승인 취소
     * @param _txIndex 트랜잭션 인덱스
     */
    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        
        require(isConfirmed[_txIndex][msg.sender], "MultisigWallet: tx not confirmed");
        
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;
        
        emit RevokeConfirmation(msg.sender, _txIndex);
    }
    
    /**
     * @dev 새 소유자 추가 (다중서명 필요)
     * @param _newOwner 추가할 새 소유자 주소
     * @return 트랜잭션 인덱스
     */
    function addOwner(address _newOwner) public onlyOwner returns (uint256) {
        require(_newOwner != address(0), "MultisigWallet: null address");
        require(!isOwner[_newOwner], "MultisigWallet: owner already exists");
        
        bytes memory data = abi.encodeWithSignature("_addOwner(address)", _newOwner);
        return submitTransaction(address(this), 0, data);
    }
    
    /**
     * @dev 내부 함수: 소유자 추가 (다중서명 후 호출됨)
     * @param _newOwner 추가할 새 소유자 주소
     */
    function _addOwner(address _newOwner) external {
        require(msg.sender == address(this), "MultisigWallet: caller must be wallet");
        require(_newOwner != address(0), "MultisigWallet: null address");
        require(!isOwner[_newOwner], "MultisigWallet: owner already exists");
        
        isOwner[_newOwner] = true;
        owners.push(_newOwner);
        
        emit OwnerAddition(_newOwner);
    }
    
    /**
     * @dev 소유자 제거 (다중서명 필요)
     * @param _owner 제거할 소유자 주소
     * @return 트랜잭션 인덱스
     */
    function removeOwner(address _owner) public onlyOwner returns (uint256) {
        require(isOwner[_owner], "MultisigWallet: not an owner");
        require(owners.length > numConfirmationsRequired, "MultisigWallet: too few owners");
        
        bytes memory data = abi.encodeWithSignature("_removeOwner(address)", _owner);
        return submitTransaction(address(this), 0, data);
    }
    
    /**
     * @dev 내부 함수: 소유자 제거 (다중서명 후 호출됨)
     * @param _owner 제거할 소유자 주소
     */
    function _removeOwner(address _owner) external {
        require(msg.sender == address(this), "MultisigWallet: caller must be wallet");
        require(isOwner[_owner], "MultisigWallet: not an owner");
        require(owners.length > numConfirmationsRequired, "MultisigWallet: too few owners");
        
        isOwner[_owner] = false;
        
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        
        emit OwnerRemoval(_owner);
    }
    
    /**
     * @dev 필요한 승인 수 변경 (다중서명 필요)
     * @param _required 새로운 필요 승인 수
     * @return 트랜잭션 인덱스
     */
    function changeRequirement(uint256 _required) public onlyOwner returns (uint256) {
        require(_required > 0, "MultisigWallet: invalid required confirmations");
        require(_required <= owners.length, "MultisigWallet: required > owners");
        
        bytes memory data = abi.encodeWithSignature("_changeRequirement(uint256)", _required);
        return submitTransaction(address(this), 0, data);
    }
    
    /**
     * @dev 내부 함수: 필요한 승인 수 변경 (다중서명 후 호출됨)
     * @param _required 새로운 필요 승인 수
     */
    function _changeRequirement(uint256 _required) external {
        require(msg.sender == address(this), "MultisigWallet: caller must be wallet");
        require(_required > 0, "MultisigWallet: invalid required confirmations");
        require(_required <= owners.length, "MultisigWallet: required > owners");
        
        numConfirmationsRequired = _required;
        
        emit RequirementChange(_required);
    }
    
    /**
     * @dev 트랜잭션 수 조회
     * @return 총 트랜잭션 수
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
    
    /**
     * @dev 트랜잭션 정보 조회
     * @param _txIndex 트랜잭션 인덱스
     * @return to 수신자 주소
     * @return value 이더 양
     * @return data 데이터
     * @return executed 실행 여부
     * @return numConfirmations 승인 수
     */
    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];
        
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
    
    /**
     * @dev 소유자 수 조회
     * @return 소유자 수
     */
    function getOwnerCount() public view returns (uint256) {
        return owners.length;
    }
    
    /**
     * @dev 소유자 목록 조회
     * @return 소유자 주소 배열
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }
    
    /**
     * @dev 대기 중인 트랜잭션 인덱스 목록 조회
     * @return 대기 중인 트랜잭션 인덱스 배열
     */
    function getPendingTransactions() public view returns (uint256[] memory) {
        uint256[] memory pendingTxs = new uint256[](pendingTransactions);
        uint256 pendingIndex = 0;
        
        for (uint256 i = 0; i < transactions.length; i++) {
            if (!transactions[i].executed) {
                pendingTxs[pendingIndex] = i;
                pendingIndex++;
            }
        }
        
        return pendingTxs;
    }
    
    // 접근 제한을 위한 modifier
    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultisigWallet: not an owner");
        _;
    }
    
    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "MultisigWallet: tx does not exist");
        _;
    }
    
    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "MultisigWallet: tx already executed");
        _;
    }
    
    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "MultisigWallet: tx already confirmed");
        _;
    }
} 