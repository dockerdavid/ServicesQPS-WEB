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
  manager: [
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
    'notFound'
  ],
};

export default roleRoutes