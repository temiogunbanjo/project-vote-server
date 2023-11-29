// @ts-nocheck
// const HelperUtils = require("../../utils/HelperUtils");
const roles = require("./Roles");

const allAccessInfo = {
  APP_ROLES: roles,
  CAN_VIEW_USERS: [
    roles.SUPER_ADMIN.name,
    roles.CUSTOMER_CARE.name,
    roles.PLAYER.name,
  ],
  CAN_CREATE_USERS: [
    roles.SUPER_ADMIN.name,
    roles.CUSTOMER_CARE.name,
    roles.PLAYER.name,
  ],
};

const populateAppRolesPermissions = () => {
  // Get list of all the "can_..." roles
  const permissions = Object.keys(allAccessInfo)
    .filter((each) => !["APP_ROLES", "APP_PERMISSIONS"].includes(each))
    .map((each) => each.toLowerCase());

  const roleNameToRoleKeyMap = {};

  // For each role such as player, superagent...,
  // roleKey = "PLAYER"
  // value = { name: "player", permissions: [] }
  Object.entries(roles).forEach(([roleKey, value]) => {
    // Formats as player = "PLAYER"
    roleNameToRoleKeyMap[value.name] = roleKey;
  });

  // For each permission ("can_do_stuff")...
  permissions.forEach((p) => {
    // Retrieve the users assigned under this permission
    const usersWithPermission = allAccessInfo[p.toUpperCase()];
    // For each user...
    usersWithPermission.forEach((userRole) => {
      // , retrieve the users assigned under this permission
      const ROLE_KEY = roleNameToRoleKeyMap[userRole];
      // if (!allAccessInfo.APP_ROLES[ROLE_KEY]) {
      // console.log(userRole, ROLE_KEY, roleNameToRoleKeyMap, userRole);
      // }
      allAccessInfo.APP_ROLES[ROLE_KEY].permissions.push(p);
    });
  });

  allAccessInfo.APP_PERMISSIONS = permissions;
  return allAccessInfo.APP_ROLES;
};

populateAppRolesPermissions();

module.exports = {
  VALID_APP_ROLES: Object.keys(roles).map((name) => roles[name].name),
  ...allAccessInfo,
  populateAppRolesPermissions,
};
