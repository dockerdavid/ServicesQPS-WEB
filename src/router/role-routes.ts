const roleRoutes = {
  super_admin: [
    'dashboard',
    'calendar',
    'communities-default',
    'communities-create',
    'communities-edit',
    'companies-default',
    'companies-create',
    'companies-edit',
    'costs-default',
    'costs-create',
    'costs-edit',
    'recurring-costs',
    'recurring-costs-default',
    'recurring-costs-create',
    'recurring-costs-edit',
    'extras-default',
    'extras-create',
    'extras-edit',
    'services-default',
    'services-create',
    'services-edit',
    'statuses-default',
    'statuses-create',
    'statuses-edit',
    'types-default',
    'types-create',
    'types-edit',
    'users-default',
    'users-create',
    'users-edit',
    'notFound'
  ],
  qa: [
    'calendar',
    'services',
    'services-default',
    'notFound'
  ],
  manager: [
    'services',
    'services-default',
    'services-create',
    'services-edit',
    'notFound'
  ],
  supervisor: [
    'services',
    'services-default',
    'services-create',
    'services-edit',
    'notFound'
  ],
  cleaner: [
    'services',
    'services-default',
    'notFound'
  ],
  cheo: [
    'dashboard',
    'calendar',
    'costs',
    'costs-default',
    'costs-create',
    'costs-edit',
    'recurring-costs',
    'recurring-costs-default',
    'recurring-costs-create',
    'recurring-costs-edit',
    'notFound'
  ],
};

export type RoleKey = keyof typeof roleRoutes;

const roleIdToKey: Record<string, RoleKey> = {
  '1': 'super_admin',
  '3': 'manager',
  '4': 'cleaner',
  '5': 'cheo',
  '6': 'supervisor',
  '7': 'qa',
};

export const resolveRoleKey = (
  roleName?: string | null,
  roleId?: string | null
): RoleKey | null => {
  if (roleName) {
    const normalized = roleName.toLowerCase().replace(/[-\s]+/g, '_');
    if (normalized in roleRoutes) {
      return normalized as RoleKey;
    }
  }

  if (roleId && roleId in roleIdToKey) {
    return roleIdToKey[roleId];
  }

  return null;
};

export const resolveRoleRoutes = (
  roleName?: string | null,
  roleId?: string | null
): string[] => {
  const roleKey = resolveRoleKey(roleName, roleId);
  return roleKey ? roleRoutes[roleKey] : [];
};

export default roleRoutes
