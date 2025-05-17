// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyToken
 * @dev 부동산 플랫폼 거버넌스를 위한 ERC20 투표 토큰
 */
contract PropertyToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // 최대 발행량 (1억 토큰)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // 한번에 민팅할 수 있는 최대량 (최대 발행량의 10%)
    uint256 public constant MAX_MINT_AMOUNT = MAX_SUPPLY / 10;
    
    // 마지막 민팅 시간
    uint256 public lastMintTime;
    
    // 민팅 쿨다운 기간 (30일)
    uint256 public constant MINT_COOLDOWN = 30 days;
    
    // 토큰 발행 권한이 있는 주소들
    mapping(address => bool) private _minters;
    
    // 이벤트 정의
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event TokensMinted(address indexed to, uint256 amount);
    
    /**
     * @dev 생성자
     * @param initialSupply 초기 발행량
     * @param treasuryAddress 초기 토큰 수령 주소 (DAO 금고)
     */
    constructor(uint256 initialSupply, address treasuryAddress)
        ERC20("Property Governance Token", "PGT")
        ERC20Permit("Property Governance Token")
    {
        require(initialSupply <= MAX_SUPPLY, "PropertyToken: initial supply exceeds max supply");
        require(treasuryAddress != address(0), "PropertyToken: treasury cannot be zero address");
        
        // 초기 토큰 발행
        _mint(treasuryAddress, initialSupply);
        
        // 배포자를 민터로 추가
        _minters[msg.sender] = true;
        
        // 마지막 민팅 시간 설정
        lastMintTime = block.timestamp;
    }
    
    /**
     * @dev 민터 권한 추가 (오너만 호출 가능)
     * @param account 민터로 지정할 주소
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "PropertyToken: minter cannot be zero address");
        _minters[account] = true;
        emit MinterAdded(account);
    }
    
    /**
     * @dev 민터 권한 제거 (오너만 호출 가능)
     * @param account 민터 권한을 제거할 주소
     */
    function removeMinter(address account) external onlyOwner {
        _minters[account] = false;
        emit MinterRemoved(account);
    }
    
    /**
     * @dev 민터 권한 확인
     * @param account 확인할 주소
     * @return 민터 권한 여부
     */
    function isMinter(address account) public view returns (bool) {
        return _minters[account];
    }
    
    /**
     * @dev 토큰 발행 (민터만 호출 가능)
     * @param to 토큰을 받을 주소
     * @param amount 발행할 토큰 양
     */
    function mint(address to, uint256 amount) external {
        require(_minters[msg.sender], "PropertyToken: caller is not a minter");
        require(to != address(0), "PropertyToken: mint to the zero address");
        require(amount > 0, "PropertyToken: mint amount must be greater than zero");
        require(amount <= MAX_MINT_AMOUNT, "PropertyToken: mint amount exceeds max mint amount");
        require(
            block.timestamp >= lastMintTime + MINT_COOLDOWN,
            "PropertyToken: mint cooldown period not passed"
        );
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "PropertyToken: mint would exceed max supply"
        );
        
        // 토큰 발행
        _mint(to, amount);
        
        // 마지막 민팅 시간 업데이트
        lastMintTime = block.timestamp;
        
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev 토큰 소각
     * @param amount 소각할 토큰 양
     */
    function burn(uint256 amount) external {
        require(amount > 0, "PropertyToken: burn amount must be greater than zero");
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev 소유자 주소로 토큰 소각 (오너만 호출 가능)
     * @param account 토큰을 소각할 주소
     * @param amount 소각할 토큰 양
     */
    function burnFrom(address account, uint256 amount) external onlyOwner {
        require(amount > 0, "PropertyToken: burn amount must be greater than zero");
        _burn(account, amount);
    }
    
    /**
     * @dev 현재 순환 공급량
     * @return 현재 발행된 총 토큰 수
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @dev 남은 발행 가능량
     * @return 추가로 발행 가능한 토큰 수
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @dev 다음 민팅 가능 시간
     * @return 다음 민팅이 가능한 타임스탬프
     */
    function nextMintTime() external view returns (uint256) {
        return lastMintTime + MINT_COOLDOWN;
    }
    
    // 필수 오버라이드: _beforeTokenTransfer
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    // 필수 오버라이드: _afterTokenTransfer (ERC20Votes)
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    // 필수 오버라이드: _mint (ERC20Votes)
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    // 필수 오버라이드: _burn (ERC20Votes)
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
} 