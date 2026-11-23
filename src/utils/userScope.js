export const DEFAULT_SECTORS = [
  {
    id: 'sector_main',
    name: 'القطاع الرئيسي',
    branchIds: ['branch_main']
  }
];

export function getUserAllowedBranches(currentUser, allBranches = []) {
  if (!currentUser) return [];

  // 1. Super Admin or roles with view_all_branches permission (or Executive Director) see all branches
  if (
    currentUser.isSuperAdmin ||
    currentUser.permissions?.view_all_branches ||
    currentUser.titleCode === 'executive_director' ||
    currentUser.titleCode === 'memberships_executive_director'
  ) {
    return allBranches;
  }

  // 2. Area Manager sees all branches in their sector/region
  if (
    currentUser.titleCode === 'area_manager' ||
    currentUser.titleCode === 'memberships_area_manager'
  ) {
    if (currentUser.sectorId) {
      const sectorBranches = allBranches.filter(
        b => b.sectorId === currentUser.sectorId || (currentUser.sectorName && b.sectorName === currentUser.sectorName)
      );
      if (sectorBranches.length > 0) return sectorBranches;
    }
  }

  // 3. Single branch roles: Branch Manager, Employee, etc. see only their assigned branch
  const assigned = allBranches.filter(b => b.id === currentUser.branchId);
  return assigned.length > 0 ? assigned : allBranches;
}

export function getUserAllowedBranchIds(currentUser, allBranches = []) {
  const allowed = getUserAllowedBranches(currentUser, allBranches);
  return allowed.map(b => b.id);
}
