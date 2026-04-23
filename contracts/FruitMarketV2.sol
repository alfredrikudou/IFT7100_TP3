// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FruitMarketV1.sol";

/**
 * @title FruitMarketV2
 * @notice Extension v2 — notation vendeur après achat.
 * @dev Seul l’acheteur (`Purchase.buyer`) peut voter une fois par achat (`purchaseId`).
 * @dev Storage ajouté après l’état hérité de V1 ; ne pas réordonner.
 */
contract FruitMarketV2 is FruitMarketV1 {
    error InvalidRating(uint8 rating);
    error PurchaseAlreadyRated(uint256 purchaseId);
    error NotPurchaseBuyer(uint256 purchaseId);

    /// @dev Somme des notes (1–5) par vendeur.
    mapping(address seller => uint256 sumRatings) private _sellerRatingSum;
    /// @dev Nombre de votes par vendeur.
    mapping(address seller => uint256 countRatings) private _sellerRatingCount;
    /// @dev Un achat = au plus une note.
    mapping(uint256 purchaseId => bool rated) private _purchaseRated;

    event SellerRated(
        uint256 indexed purchaseId,
        address indexed seller,
        address indexed buyer,
        uint8 rating,
        uint256 newAverageScaledBy100,
        uint256 totalRatings
    );

    /**
     * @notice Attribuer une note (1–5) au vendeur pour un achat donné.
     * @dev Seul `purchase.buyer` peut appeler ; une fois par `purchaseId`.
     */
    function rateSeller(uint256 purchaseId, uint8 rating) external {
        Purchase memory pu = _purchases[purchaseId];
        if (pu.id == 0) revert PurchaseNotFound(purchaseId);
        if (pu.buyer != msg.sender) revert NotPurchaseBuyer(purchaseId);
        if (_purchaseRated[purchaseId]) revert PurchaseAlreadyRated(purchaseId);
        if (rating < 1 || rating > 5) revert InvalidRating(rating);

        address seller = pu.seller;
        _purchaseRated[purchaseId] = true;

        _sellerRatingSum[seller] += rating;
        _sellerRatingCount[seller] += 1;

        uint256 totalRatings = _sellerRatingCount[seller];
        uint256 totalScore = _sellerRatingSum[seller];
        uint256 avgScaled = totalRatings != 0 ? (totalScore * 100) / totalRatings : 0;

        emit SellerRated(purchaseId, seller, msg.sender, rating, avgScaled, totalRatings);
    }

    /**
     * @notice Agrégats de notation pour un vendeur.
     * @return totalScore somme des notes ;
     * @return totalRatings nombre de notes ;
     * @return averageScaledBy100 moyenne × 100 (arrondi vers le bas).
     */
    function getSellerRating(address seller)
        external
        view
        returns (uint256 totalScore, uint256 totalRatings, uint256 averageScaledBy100)
    {
        totalScore = _sellerRatingSum[seller];
        totalRatings = _sellerRatingCount[seller];
        averageScaledBy100 = totalRatings != 0 ? (totalScore * 100) / totalRatings : 0;
    }

    /**
     * @notice Indique si cet achat a déjà été noté.
     */
    function isPurchaseRated(uint256 purchaseId) external view returns (bool) {
        return _purchaseRated[purchaseId];
    }

    /**
     * @dev Réserve pour upgrades futurs après v2.
     */
    uint256[47] private __gapV2;
}
