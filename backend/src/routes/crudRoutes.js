import { Router } from "express";

import { allowRoles } from "../middleware/authMiddleware.js";

export function createCrudRouter(
  controller,
  { writeRoles = ["Owner", "Admin"], deleteRoles = writeRoles } = {},
) {
  const router = Router();

  router
    .route("/")
    .get(controller.list)
    .post(allowRoles(...writeRoles), controller.create);
  router
    .route("/:id")
    .get(controller.getOne)
    .put(allowRoles(...writeRoles), controller.update)
    .patch(allowRoles(...writeRoles), controller.update)
    .delete(allowRoles(...deleteRoles), controller.remove);

  return router;
}
