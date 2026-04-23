const express = require("express");

const productController = require("../controllers/product.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createProductValidator,
  productIdParamValidator,
  productListQueryValidator,
  stockAdjustmentValidator,
  stockInValidator,
  updateProductValidator
} = require("../validators/product.validator");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router.get("/", validate(productListQueryValidator), productController.listProducts);
router.get("/:id", validate(productIdParamValidator), productController.getProductById);
router.get("/:id/stock-movements", validate(productIdParamValidator), productController.listProductStockMovements);
router.post("/", authorizeRoles("admin"), validate(createProductValidator), productController.createProduct);
router.put("/:id", authorizeRoles("admin"), validate(updateProductValidator), productController.updateProduct);
router.patch("/:id/stock-in", authorizeRoles("admin"), validate(stockInValidator), productController.stockInProduct);
router.patch(
  "/:id/stock-adjustment",
  authorizeRoles("admin"),
  validate(stockAdjustmentValidator),
  productController.adjustProductStock
);

module.exports = router;
