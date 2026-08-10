import asyncHandler from "express-async-handler";
import { adminService } from "../services/index.js";

export const searchUsers = asyncHandler(async (req, res) => {
  res.status(200).json(await adminService.searchUsers(req.query.q ?? ""));
});

export const getUser = asyncHandler(async (req, res) => {
  res.status(200).json(await adminService.getUser(req.params.userId));
});

export const resetDailyBonus = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await adminService.resetDailyBonus(req.params.userId));
});

export const setUserRoles = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await adminService.setUserRoles(req.params.userId, req.body.roleIds));
});

export const listRoles = asyncHandler(async (req, res) => {
  res.status(200).json(await adminService.listRoles());
});

export const createRole = asyncHandler(async (req, res) => {
  res.status(201).json(await adminService.createRole(req.body));
});

export const updateRole = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await adminService.updateRole(req.params.roleId, req.body));
});

export const deleteRole = asyncHandler(async (req, res) => {
  res.status(200).json(await adminService.deleteRole(req.params.roleId));
});

export const setRolePermissions = asyncHandler(async (req, res) => {
  res.status(200).json(
    await adminService.setRolePermissions(
      req.params.roleId,
      req.body.permissionIds
    )
  );
});

export const listPermissions = asyncHandler(async (req, res) => {
  res.status(200).json(await adminService.listPermissions());
});

export const createPermission = asyncHandler(async (req, res) => {
  res.status(201).json(await adminService.createPermission(req.body));
});

export const updatePermission = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      await adminService.updatePermission(req.params.permissionId, req.body)
    );
});

export const deletePermission = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(await adminService.deletePermission(req.params.permissionId));
});
