// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
/**
 * @title FruitMarketV1
 * @notice Marché de fruits (TP3) — version initiale upgradeable (UUPS).
 * @dev Complète les corps des fonctions marquées TODO. `_authorizeUpgrade` est déjà correct pour UUPS + Ownable.
 * @dev Réentrance : avec OZ v5, ajoute une protection adaptée dans `purchaseProduct` (pattern CEI et/ou guard si tu lies une implémentation compatible).
 */
contract FruitMarketV1 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // --- Erreurs (complète / ajuste selon ta logique) ---
    error InvalidProductName();
    error InvalidPrice();
    error InvalidStock();
    error ProductNotFound(uint256 productId);
    error NotProductSeller(uint256 productId);
    error ProductInactive(uint256 productId);
    error InvalidQuantity();
    error InsufficientStock(uint256 requested, uint256 available);
    error InvalidPayment(uint256 expected, uint256 received);
    error TransferFailed();
    error PurchaseNotFound(uint256 purchaseId);
    error InvalidDescription();
    error InvalidIconId();

    uint256 public constant MAX_DESCRIPTION_LENGTH = 400;
    uint8 public constant MAX_ICON_ID = 9;

    // --- Modèles ---

    struct Product {
        uint256 id;
        string name;
        string description;
        uint8 iconId;
        uint256 priceWei;
        uint256 stock;
        address seller;
        bool active;
    }

    struct Purchase {
        uint256 id;
        uint256 productId;
        address buyer;
        address seller;
        uint256 quantity;
        uint256 totalPaid;
        uint256 timestamp;
    }

    // --- État (ordre important pour les upgrades : n’insère pas de variables au milieu plus tard) ---

    uint256 public nextProductId;
    uint256 public nextPurchaseId;

    mapping(uint256 id => Product) internal _products;
    mapping(uint256 id => Purchase) internal _purchases;

    // --- Événements ---

    event ProductAdded(
        uint256 indexed productId,
        address indexed seller,
        string name,
        string description,
        uint8 iconId,
        uint256 priceWei,
        uint256 stock
    );
    event ProductUpdated(
        uint256 indexed productId, 
        uint256 priceWei, 
        uint256 stock, 
        bool active
    );
    event ProductPurchased(
        uint256 indexed purchaseId,
        uint256 indexed productId,
        address indexed buyer,
        address seller,
        uint256 quantity,
        uint256 totalPaid
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialise le proxy (une seule fois).
     * @dev Complète si besoin : compteurs, paramètres globaux, etc.
     */
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        /* UUPS OZ v5 est stateless : pas de __UUPSUpgradeable_init */

        nextProductId = 1;
        nextPurchaseId = 1;
        defaultProducts(msg.sender);
    }

    /**
     * @notice Catalogue initial : 3 annonces au nom du propriétaire (`seller` = déployeur du proxy).
     * @dev Appelée une seule fois depuis `initialize`.
     */
    function defaultProducts(address seller) internal {
        _pushDefaultProduct(
            seller,
            "Pommes Cortland",
            "Cueillette locale, sac de 5 kg.",
            0,
            0.001 ether,
            80
        );
        _pushDefaultProduct(
            seller,
            "Bananes bio",
            unicode"Origine Guatemala, point m\u00fbr.",
            3,
            0.002 ether,
            60
        );
        _pushDefaultProduct(
            seller,
            "Oranges Valencia",
            unicode"Jus ou table, cat\u00e9gorie I.",
            2,
            0.0015 ether,
            45
        );
    }

    function _pushDefaultProduct(
        address seller,
        string memory name,
        string memory description,
        uint8 iconId,
        uint256 priceWei,
        uint256 stock
    ) private {
        uint256 productId = nextProductId++;
        _products[productId] = Product({
            id: productId,
            name: name,
            description: description,
            iconId: iconId,
            priceWei: priceWei,
            stock: stock,
            seller: seller,
            active: true
        });
        emit ProductAdded(productId, seller, name, description, iconId, priceWei, stock);
    }

    /**
     * @notice Ajouter un produit au catalogue (vendeur = msg.sender).
     * @param name nom du produit (non vide)
     * @param priceWei prix unitaire en wei (strictement positif)
     * @param stock quantité initiale disponible (> 0)
     * @param description texte libre (peut être vide ; longueur plafonnée)
     * @param iconId indice visuel 0..MAX_ICON_ID (aligné UI : liste d’emojis côté front)
     * @return productId identifiant du nouveau produit
     */
    function addProduct(
        string calldata name,
        uint256 priceWei,
        uint256 stock,
        string calldata description,
        uint8 iconId
    ) external returns (uint256 productId) {
        if (bytes(name).length == 0) revert InvalidProductName();
        if (priceWei == 0) revert InvalidPrice();
        if (stock == 0) revert InvalidStock();
        if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert InvalidDescription();
        if (iconId > MAX_ICON_ID) revert InvalidIconId();

        productId = nextProductId++;
        _products[productId] = Product({
            id: productId,
            name: name,
            description: description,
            iconId: iconId,
            priceWei: priceWei,
            stock: stock,
            seller: msg.sender,
            active: true
        });

        emit ProductAdded(productId, msg.sender, name, description, iconId, priceWei, stock);
        return productId;
    }

    /**
     * @notice Mettre à jour prix, stock et statut actif (uniquement le vendeur du produit).
     * @param productId identifiant du produit
     * @param newPriceWei nouveau prix unitaire en wei (> 0)
     * @param newStock nouveau stock ; si `active` est true, doit être > 0
     * @param active annonce visible à l’achat ou non
     */
    function updateProduct(uint256 productId, uint256 newPriceWei, uint256 newStock, bool active) external {
        Product storage p = _products[productId];
        if (p.id == 0) revert ProductNotFound(productId);
        if (p.seller != msg.sender) revert NotProductSeller(productId);
        if (newPriceWei == 0) revert InvalidPrice();
        if (active && newStock == 0) revert InvalidStock();

        p.priceWei = newPriceWei;
        p.stock = newStock;
        p.active = active;

        emit ProductUpdated(productId, newPriceWei, newStock, active);
    }

    /**
     * @notice Désactiver une annonce (soft delete).
     */
    function deactivateProduct(uint256 productId) external {
        Product storage p = _products[productId];
        if (p.id == 0) revert ProductNotFound(productId);
        if (p.seller != msg.sender) revert NotProductSeller(productId);

        p.active = false;

        emit ProductUpdated(productId, p.priceWei, p.stock, false);
    }

    /**
     * @notice Acheter une quantité ; paiement exact en wei (`msg.value` == prix unitaire × quantité).
     * @dev Checks-effects-interactions : état mis à jour avant transfert ETH au vendeur (réduction surface de réentrance).
     */
    function purchaseProduct(uint256 productId, uint256 quantity) external payable returns (uint256 purchaseId) {
        if (quantity == 0) revert InvalidQuantity();

        Product storage p = _products[productId];
        if (p.id == 0) revert ProductNotFound(productId);
        if (!p.active) revert ProductInactive(productId);
        if (quantity > p.stock) revert InsufficientStock(quantity, p.stock);

        uint256 totalPrice = p.priceWei * quantity;
        if (msg.value != totalPrice) revert InvalidPayment(totalPrice, msg.value);

        uint256 newStock = p.stock - quantity;
        p.stock = newStock;
        if (newStock == 0) {
            p.active = false;
        }

        purchaseId = nextPurchaseId++;
        _purchases[purchaseId] = Purchase({
            id: purchaseId,
            productId: productId,
            buyer: msg.sender,
            seller: p.seller,
            quantity: quantity,
            totalPaid: totalPrice,
            timestamp: block.timestamp
        });

        emit ProductPurchased(purchaseId, productId, msg.sender, p.seller, quantity, totalPrice);
        emit ProductUpdated(productId, p.priceWei, newStock, p.active);

        (bool sent, ) = payable(p.seller).call{value: totalPrice}("");
        if (!sent) revert TransferFailed();
    }

    /**
     * @notice Lecture d’un produit.
     */
    function getProduct(uint256 productId) external view returns (Product memory) {
        Product memory prod = _products[productId];
        if (prod.id == 0) revert ProductNotFound(productId);
        return prod;
    }

    /**
     * @notice Lecture d’un achat enregistré.
     */
    function getPurchase(uint256 purchaseId) external view returns (Purchase memory) {
        Purchase memory pu = _purchases[purchaseId];
        if (pu.id == 0) revert PurchaseNotFound(purchaseId);
        return pu;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Espace réservé pour futures variables dans des versions ultérieures (sans casser le layout storage).
     */
    uint256[50] private __gap;
}
