/** Pantallas del super admin. El Admin Papel (rol 9) ve exactamente las mismas;
 *  sus cambios quedan en aprobación (lo resuelve el API). */
const superAdminRoutes = [
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
  'recurring-services',
  'recurring-services-default',
  'recurring-services-create',
  'recurring-services-edit',
  'extras-default',
  'extras-create',
  'extras-edit',
  'news',
  'news-default',
  'news-create',
  'news-edit',
  'services-default',
  'services-create',
  'services-edit',
  'services-tracking',
  'chat',
  'statuses-default',
  'statuses-create',
  'statuses-edit',
  'types-default',
  'types-create',
  'types-edit',
  'users-default',
  'users-create',
  'users-edit',
  'kds-admin',
  'kds-admin-default',
  'approvals',
  'notFound'
];

const roleRoutes = {
  super_admin: superAdminRoutes,
  admin_papel: [
    // 'notFound' al final: homeRouteFor toma la primera que no sea notFound.
    ...superAdminRoutes.filter((name) => name !== 'approvals' && name !== 'notFound'),
    'approvals-mine',
    'notFound',
  ],
  qa: [
    'chat',
    'kds-qa',
    'kds-qa-default',
    'calendar',
    'notFound'
  ],
  manager: [
    'services',
    'services-default',
    'services-create',
    'services-edit',
    'services-tracking',
    'notFound'
  ],
  supervisor: [
    'services',
    'services-default',
    'services-create',
    'services-edit',
    'services-tracking',
    'notFound'
  ],
  cleaner: [
    'services',
    'services-default',
    'calendar',
    'notFound'
  ],
  vendedor: [
    'vendedor-comisiones',
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

/** Roles que la UI trata como administrador (lectura/permisos de pantalla). */
export const ADMIN_LIKE_ROLE_IDS = ['1', '9'];

export const isAdminLikeRole = (roleId?: string | null, roleName?: string | null): boolean => {
  if (roleId && ADMIN_LIKE_ROLE_IDS.includes(String(roleId))) return true;
  const key = roleName ? roleName.toLowerCase().replace(/[-\s]+/g, '_') : '';
  return key === 'super_admin' || key === 'admin_papel';
};

export const isAdminPapelRole = (roleId?: string | null, roleName?: string | null): boolean =>
  String(roleId ?? '') === '9' || (roleName ?? '').toLowerCase().replace(/[-\s]+/g, '_') === 'admin_papel';

const roleIdToKey: Record<string, RoleKey> = {
  '1': 'super_admin',
  '3': 'manager',
  '4': 'cleaner',
  '5': 'cheo',
  '6': 'supervisor',
  '7': 'qa',
  '8': 'vendedor',
  '9': 'admin_papel',
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

export const canAccessRoute = (
  routeName: string,
  roleName?: string | null,
  roleId?: string | null
): boolean => resolveRoleRoutes(roleName, roleId).includes(routeName);

/** Primera pantalla permitida del rol: a donde aterriza tras el login. */
export const homeRouteFor = (
  roleName?: string | null,
  roleId?: string | null
): string | null => resolveRoleRoutes(roleName, roleId).find((name) => name !== 'notFound') ?? null;

export default roleRoutes
