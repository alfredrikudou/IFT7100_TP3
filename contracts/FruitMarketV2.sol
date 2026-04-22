// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FruitMarketV1.sol";

/**
 * @title FruitMarketV2
 * @notice Extension v2 — notation vendeur après achat (TP3).
 * @dev Ajoute uniquement du storage à la FIN du contrat parent (après le __gap de V1 si tu déplaces le gap — ici V1 garde son __gap interne).
 *      Les nouvelles variables doivent rester après tout l’état hérité ; ne réordonne pas le storage de V1.
 */
contract FruitMarketV2 is FruitMarketV1 {
    // --- Erreurs v2 (exemples) ---
    error NotImplementedV2();
    // error InvalidRating(uint8 rating);
    // error PurchaseNotFound(uint256 purchaseId);
    // error PurchaseAlreadyRated(uint256 purchaseId);
    // error NotPurchaseBuyer(uint256 purchaseId);

    // --- Nouvel état (après les variables héritées de V1) ---

    // mapping(address => uint256) private _sellerRatingTotal;
    // mapping(address => uint256) private _sellerRatingCount;
    // mapping(uint256 => bool) private _purchaseRated;

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
     * @dev À lier à un Purchase existant ; empêcher le double vote.
     */
    function rateSeller(uint256, uint8) external {
        // TODO
        revert NotImplementedV2();
    }

    /**
     * @notice Agrégats de notation pour un vendeur.
     * @return totalScore somme des notes ; totalRatings nombre de notes ; averageScaledBy100 moyenne × 100.
     */
    function getSellerRating(address)
        external
        view
        returns (uint256, uint256, uint256)
    {
        // TODO
        revert NotImplementedV2();
    }

    /**
     * @notice Indique si cet achat a déjà été noté.
     */
    function isPurchaseRated(uint256) external view returns (bool) {
        // TODO
        revert NotImplementedV2();
    }

    /**
     * @dev Réserve pour upgrades futurs après v2.
     */
    uint256[47] private __gapV2;
}
