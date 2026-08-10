import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../config/api";
import "./AdminPage.scss";

const SEARCH_DELAY_MS = 300;
const blankAccessItem = { displayName: "", key: "" };

async function adminRequest(path, options = {}) {
  const response = await fetch(apiUrl(`/admin${path}`), {
    credentials: "include",
    ...options,
    headers: options.body
      ? { "Content-Type": "application/json", ...options.headers }
      : options.headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Something went wrong");
  return payload.data;
}

const money = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Never";

const initials = (username = "?") => username.slice(0, 2).toUpperCase();
const selectedIds = (items = []) => items.map(({ id }) => id);
const sameIds = (left, right) =>
  [...left].sort((a, b) => a - b).join(",") ===
  [...right].sort((a, b) => a - b).join(",");

function SearchIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3Z" />
      <path d="m9.2 12 1.8 1.8 3.9-4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19M15.5 5.5a3 3 0 0 1 0 5.5M17 13a4 4 0 0 1 3.5 4v2" />
    </svg>
  );
}

function AccessChecklist({
  items,
  selected,
  onToggle,
  emptyMessage,
  loading,
}) {
  const selectedSet = new Set(selected);
  if (loading) return <div className="permissions-state">Loading access…</div>;
  if (!items.length) return <div className="permissions-state">{emptyMessage}</div>;

  return (
    <div className="permission-checklist">
      {items.map((item) => (
        <label
          className={`permission-option${
            selectedSet.has(item.id) ? " is-checked" : ""
          }`}
          key={item.id}
        >
          <input
            type="checkbox"
            checked={selectedSet.has(item.id)}
            onChange={() => onToggle(item.id)}
          />
          <span className="custom-checkbox">
            <span>✓</span>
          </span>
          <span>
            <strong>{item.displayName}</strong>
            <small>{item.key}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("users");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [userRoleDraft, setUserRoleDraft] = useState([]);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissionDraft, setRolePermissionDraft] = useState([]);
  const [roleForm, setRoleForm] = useState(blankAccessItem);
  const [editingRole, setEditingRole] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionForm, setPermissionForm] = useState(blankAccessItem);
  const [editingPermission, setEditingPermission] = useState(null);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState(null);

  const showNotice = useCallback((message, type = "success") => {
    setNotice({ message, type });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      SEARCH_DELAY_MS
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setUsersLoading(true);
    setUsersError("");
    adminRequest(`/users?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(setUsers)
      .catch((error) => {
        if (error.name !== "AbortError") setUsersError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setUsersLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const nextRoles = await adminRequest("/roles");
      setRoles(nextRoles);
      setSelectedRole((current) => {
        if (!current) return null;
        return nextRoles.find(({ id }) => id === current.id) ?? null;
      });
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setRolesLoading(false);
    }
  }, [showNotice]);

  const loadPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      setPermissions(await adminRequest("/permissions"));
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setPermissionsLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [loadPermissions, loadRoles]);

  const selectUser = async (userId) => {
    setSelectedLoading(true);
    setNotice(null);
    try {
      const user = await adminRequest(`/users/${userId}`);
      setSelectedUser(user);
      setUserRoleDraft(selectedIds(user.roles));
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSelectedLoading(false);
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setRolePermissionDraft(selectedIds(role.permissions));
    setEditingRole(null);
    setNotice(null);
  };

  const toggleId = (setter, itemId) => {
    setter((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  };

  const resetBonus = async () => {
    if (!selectedUser) return;
    setSaving("bonus");
    try {
      const user = await adminRequest(
        `/users/${selectedUser.id}/daily-bonus/reset`,
        { method: "POST" }
      );
      setSelectedUser(user);
      setUserRoleDraft(selectedIds(user.roles));
      showNotice(`${user.username}'s daily bonus was reset.`);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const saveUserRoles = async () => {
    if (!selectedUser) return;
    setSaving("user-roles");
    try {
      const user = await adminRequest(`/users/${selectedUser.id}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roleIds: userRoleDraft }),
      });
      setSelectedUser(user);
      setUserRoleDraft(selectedIds(user.roles));
      showNotice(`Roles updated for ${user.username}.`);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const createRole = async (event) => {
    event.preventDefault();
    setSaving("create-role");
    try {
      const role = await adminRequest("/roles", {
        method: "POST",
        body: JSON.stringify(roleForm),
      });
      setRoleForm(blankAccessItem);
      setRoles((current) => [...current, role]);
      selectRole(role);
      showNotice("Role created.");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const updateRole = async (event) => {
    event.preventDefault();
    if (!editingRole) return;
    setSaving(`role-${editingRole.id}`);
    try {
      const updated = await adminRequest(`/roles/${editingRole.id}`, {
        method: "PATCH",
        body: JSON.stringify(editingRole),
      });
      setRoles((current) =>
        current.map((role) => (role.id === updated.id ? updated : role))
      );
      setSelectedRole(updated);
      setEditingRole(null);
      setSelectedUser((current) =>
        current
          ? {
              ...current,
              roles: current.roles.map((role) =>
                role.id === updated.id ? updated : role
              ),
            }
          : current
      );
      showNotice("Role updated.");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const deleteRole = async (role) => {
    if (!window.confirm(`Delete “${role.displayName}”? It will be removed from every user.`)) return;
    setSaving(`role-${role.id}`);
    try {
      await adminRequest(`/roles/${role.id}`, { method: "DELETE" });
      setRoles((current) => current.filter(({ id }) => id !== role.id));
      setUserRoleDraft((current) => current.filter((id) => id !== role.id));
      setSelectedUser((current) =>
        current
          ? { ...current, roles: current.roles.filter(({ id }) => id !== role.id) }
          : current
      );
      setSelectedRole(null);
      setRolePermissionDraft([]);
      showNotice("Role deleted.");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    setSaving("role-permissions");
    try {
      const role = await adminRequest(`/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds: rolePermissionDraft }),
      });
      setSelectedRole(role);
      setRolePermissionDraft(selectedIds(role.permissions));
      setRoles((current) =>
        current.map((item) => (item.id === role.id ? role : item))
      );
      showNotice(`Permissions updated for ${role.displayName}.`);
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const createPermission = async (event) => {
    event.preventDefault();
    setSaving("create-permission");
    try {
      const permission = await adminRequest("/permissions", {
        method: "POST",
        body: JSON.stringify(permissionForm),
      });
      setPermissionForm(blankAccessItem);
      setPermissions((current) => [...current, permission]);
      showNotice("Permission created.");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const updatePermission = async (event) => {
    event.preventDefault();
    if (!editingPermission) return;
    setSaving(`permission-${editingPermission.id}`);
    try {
      const updated = await adminRequest(
        `/permissions/${editingPermission.id}`,
        { method: "PATCH", body: JSON.stringify(editingPermission) }
      );
      setPermissions((current) =>
        current.map((permission) =>
          permission.id === updated.id ? updated : permission
        )
      );
      const updateRolePermission = (role) => ({
        ...role,
        permissions: role.permissions.map((permission) =>
          permission.id === updated.id ? updated : permission
        ),
      });
      setRoles((current) => current.map(updateRolePermission));
      setSelectedRole((current) =>
        current ? updateRolePermission(current) : current
      );
      setEditingPermission(null);
      showNotice("Permission updated.");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const deletePermission = async (permission) => {
    if (!window.confirm(`Delete “${permission.displayName}”? It will be removed from every role.`)) return;
    setSaving(`permission-${permission.id}`);
    try {
      await adminRequest(`/permissions/${permission.id}`, { method: "DELETE" });
      setPermissions((current) => current.filter(({ id }) => id !== permission.id));
      setRolePermissionDraft((current) =>
        current.filter((id) => id !== permission.id)
      );
      const removeRolePermission = (role) => ({
        ...role,
        permissions: role.permissions.filter(({ id }) => id !== permission.id),
      });
      setRoles((current) => current.map(removeRolePermission));
      setSelectedRole((current) =>
        current ? removeRolePermission(current) : current
      );
      showNotice("Permission deleted.");
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      setSaving("");
    }
  };

  const userRolesChanged = selectedUser
    ? !sameIds(userRoleDraft, selectedIds(selectedUser.roles))
    : false;
  const rolePermissionsChanged = selectedRole
    ? !sameIds(rolePermissionDraft, selectedIds(selectedRole.permissions))
    : false;
  const roleSet = useMemo(() => new Set(userRoleDraft), [userRoleDraft]);

  return (
    <main className="admin-page">
      <div className="admin-page-inner">
        <header className="admin-hero">
          <div>
            <span className="admin-eyebrow">Chimp Cino operations</span>
            <h1>Control room</h1>
            <p>Manage player accounts, roles, and access from one workspace.</p>
          </div>
          <div className="admin-hero-badge">
            <ShieldIcon />
            <span>Admin tools<small>Live workspace</small></span>
          </div>
        </header>

        <nav className="admin-section-nav" aria-label="Admin sections">
          <button
            type="button"
            className={activeSection === "users" ? "is-active" : ""}
            onClick={() => setActiveSection("users")}
          >
            <UsersIcon />
            <span><strong>Users</strong><small>Accounts & roles</small></span>
          </button>
          <button
            type="button"
            className={activeSection === "access" ? "is-active" : ""}
            onClick={() => setActiveSection("access")}
          >
            <ShieldIcon />
            <span><strong>Roles & permissions</strong><small>Access structure</small></span>
          </button>
        </nav>

        {notice ? (
          <div className={`admin-notice is-${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
            <span>{notice.message}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button>
          </div>
        ) : null}

        {activeSection === "users" ? (
          <div className="admin-workspace">
            <section className="admin-panel player-directory">
              <div className="panel-heading">
                <div><span>Players</span><h2>User directory</h2></div>
                <span className="result-count">Up to 12</span>
              </div>
              <label className="admin-search">
                <SearchIcon />
                <input type="search" value={query} placeholder="Username or email" aria-label="Search users" onChange={(event) => setQuery(event.target.value)} />
                {query ? <button type="button" aria-label="Clear user search" onClick={() => setQuery("")}>×</button> : null}
              </label>
              <p className="search-caption">{debouncedQuery ? `Matches for “${debouncedQuery}”` : "Most recently created accounts"}</p>
              <div className="player-list" aria-busy={usersLoading}>
                {usersLoading ? Array.from({ length: 6 }, (_, index) => (
                  <div className="player-row player-row-skeleton" key={index}><span /><div><i /><i /></div></div>
                )) : usersError ? <div className="directory-state is-error">{usersError}</div> : users.length ? users.map((user) => (
                  <button type="button" className={`player-row${selectedUser?.id === user.id ? " is-selected" : ""}`} key={user.id} onClick={() => selectUser(user.id)}>
                    <span className="player-avatar">{initials(user.username)}</span>
                    <span className="player-row-copy"><strong>{user.username}</strong><small>{user.email}</small></span>
                    <span className="player-row-arrow" aria-hidden="true">→</span>
                  </button>
                )) : <div className="directory-state"><SearchIcon /><strong>No players found</strong><span>Try a different username or email.</span></div>}
              </div>
            </section>

            <section className="admin-panel player-workbench">
              {selectedLoading ? <div className="workbench-empty" role="status"><span className="admin-spinner" /><strong>Loading player</strong></div> : selectedUser ? (
                <>
                  <div className="player-profile">
                    <span className="profile-avatar">{initials(selectedUser.username)}</span>
                    <div><span className="profile-label">Player #{selectedUser.id}</span><h2>{selectedUser.username}</h2><p>{selectedUser.email}</p></div>
                    <span className="profile-status"><i /> Active</span>
                  </div>
                  <div className="player-stats">
                    <div><span>Wallet</span><strong>{money.format(selectedUser.balance)}</strong><small>Chimpcino coins</small></div>
                    <div><span>Bonus streak</span><strong>{selectedUser.dailyBonusStreak}</strong><small>Consecutive days</small></div>
                    <div><span>Last claimed</span><strong>{dateLabel(selectedUser.lastDailyBonusClaimedOn)}</strong><small>Daily reward</small></div>
                  </div>
                  <div className="admin-section account-actions">
                    <div className="section-heading"><div><span>Player actions</span><h3>Daily bonus</h3></div><span className="section-number">01</span></div>
                    <div className="action-row">
                      <div className="action-icon bonus-icon" aria-hidden="true">↻</div>
                      <div className="action-copy"><strong>Reset daily bonus</strong><span>Clears the current streak and allows this player to claim again.</span></div>
                      <button className="secondary-action danger-action" type="button" disabled={saving === "bonus"} onClick={resetBonus}>{saving === "bonus" ? "Resetting…" : "Reset bonus"}</button>
                    </div>
                  </div>
                  <div className="admin-section user-permissions">
                    <div className="section-heading"><div><span>Access control</span><h3>Assigned roles</h3></div><span className="section-number">02</span></div>
                    <AccessChecklist items={roles} selected={userRoleDraft} loading={rolesLoading} emptyMessage="Create a role in Roles & permissions to begin assigning access." onToggle={(id) => toggleId(setUserRoleDraft, id)} />
                    <div className="permission-save-row">
                      <span>{roleSet.size} role{roleSet.size === 1 ? "" : "s"} selected</span>
                      <button className="primary-action" type="button" disabled={!userRolesChanged || saving === "user-roles"} onClick={saveUserRoles}>{saving === "user-roles" ? "Saving…" : "Save roles"}</button>
                    </div>
                  </div>
                </>
              ) : <div className="workbench-empty"><div className="empty-shield"><UsersIcon /></div><strong>Select a player</strong><span>Choose an account to view information, actions, and assigned roles.</span></div>}
            </section>
          </div>
        ) : (
          <>
            <div className="access-workspace">
              <section className="admin-panel role-directory">
                <div className="panel-heading"><div><span>Roles</span><h2>Role directory</h2></div><span className="result-count">{roles.length}</span></div>
                <form className="compact-create-form" onSubmit={createRole}>
                  <label><span>Role name</span><input required maxLength="100" value={roleForm.displayName} placeholder="Support agent" onChange={(event) => setRoleForm((current) => ({ ...current, displayName: event.target.value }))} /></label>
                  <label><span>Role key</span><input required maxLength="100" pattern="[a-z][a-z0-9:_-]+" value={roleForm.key} placeholder="support_agent" onChange={(event) => setRoleForm((current) => ({ ...current, key: event.target.value.toLowerCase().replace(/\s+/g, "_") }))} /></label>
                  <button className="primary-action" type="submit" disabled={saving === "create-role"}><span aria-hidden="true">+</span>{saving === "create-role" ? "Creating…" : "Create role"}</button>
                </form>
                <div className="role-list" aria-busy={rolesLoading}>
                  {rolesLoading ? <div className="permissions-state">Loading roles…</div> : roles.length ? roles.map((role) => (
                    <button type="button" className={`role-row${selectedRole?.id === role.id ? " is-selected" : ""}`} key={role.id} onClick={() => selectRole(role)}>
                      <span className="role-icon"><ShieldIcon /></span>
                      <span><strong>{role.displayName}</strong><small>{role.key}</small></span>
                      <em>{role.permissions.length}</em>
                    </button>
                  )) : <div className="permissions-state">Create your first role above.</div>}
                </div>
              </section>

              <section className="admin-panel role-workbench">
                {selectedRole ? (
                  <>
                    <div className="role-profile">
                      <div className="role-profile-icon"><ShieldIcon /></div>
                      {editingRole ? (
                        <div className="role-edit-fields">
                          <input aria-label="Role name" maxLength="100" value={editingRole.displayName} onChange={(event) => setEditingRole((current) => ({ ...current, displayName: event.target.value }))} />
                          <input aria-label="Role key" maxLength="100" value={editingRole.key} onChange={(event) => setEditingRole((current) => ({ ...current, key: event.target.value.toLowerCase() }))} />
                        </div>
                      ) : <div><span className="profile-label">Role #{selectedRole.id}</span><h2>{selectedRole.displayName}</h2><p>{selectedRole.key}</p></div>}
                      <div className="role-profile-actions">
                        {editingRole ? <><button className="table-action is-save" type="button" onClick={updateRole}>Save</button><button className="table-action" type="button" onClick={() => setEditingRole(null)}>Cancel</button></> : <button className="table-action" type="button" onClick={() => setEditingRole({ ...selectedRole })}>Edit role</button>}
                        <button className="table-action is-delete" type="button" disabled={saving === `role-${selectedRole.id}`} onClick={() => deleteRole(selectedRole)}>Delete</button>
                      </div>
                    </div>
                    <div className="admin-section role-permissions">
                      <div className="section-heading"><div><span>Capabilities</span><h3>Permissions on this role</h3></div><span className="section-number">{rolePermissionDraft.length}</span></div>
                      <AccessChecklist items={permissions} selected={rolePermissionDraft} loading={permissionsLoading} emptyMessage="Create a permission below to configure this role." onToggle={(id) => toggleId(setRolePermissionDraft, id)} />
                      <div className="permission-save-row"><span>{rolePermissionDraft.length} permission{rolePermissionDraft.length === 1 ? "" : "s"} selected</span><button className="primary-action" type="button" disabled={!rolePermissionsChanged || saving === "role-permissions"} onClick={saveRolePermissions}>{saving === "role-permissions" ? "Saving…" : "Save permissions"}</button></div>
                    </div>
                  </>
                ) : <div className="workbench-empty"><div className="empty-shield"><ShieldIcon /></div><strong>Select a role</strong><span>Choose a role to edit it and manage its permissions.</span></div>}
              </section>
            </div>

            <section className="admin-panel permission-library">
              <div className="permission-library-header"><div className="panel-heading"><div><span>Permissions</span><h2>Permission library</h2></div></div><p>Create reusable capabilities, then attach them to roles.</p></div>
              <form className="permission-create-form" onSubmit={createPermission}>
                <label><span>Permission name</span><input required maxLength="100" value={permissionForm.displayName} placeholder="Reset player bonus" onChange={(event) => setPermissionForm((current) => ({ ...current, displayName: event.target.value }))} /></label>
                <label><span>Permission key</span><input required maxLength="100" pattern="[a-z][a-z0-9:_-]+" value={permissionForm.key} placeholder="user:reset_bonus" onChange={(event) => setPermissionForm((current) => ({ ...current, key: event.target.value.toLowerCase().replace(/\s+/g, "_") }))} /></label>
                <button className="primary-action" type="submit" disabled={saving === "create-permission"}><span aria-hidden="true">+</span>{saving === "create-permission" ? "Creating…" : "Create permission"}</button>
              </form>
              <div className="permission-table-wrap">
                <table className="permission-table">
                  <thead><tr><th>Name</th><th>Key</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                  <tbody>{permissions.map((permission) => editingPermission?.id === permission.id ? (
                    <tr key={permission.id} className="is-editing"><td><input aria-label="Permission name" maxLength="100" value={editingPermission.displayName} onChange={(event) => setEditingPermission((current) => ({ ...current, displayName: event.target.value }))} /></td><td><input aria-label="Permission key" maxLength="100" value={editingPermission.key} onChange={(event) => setEditingPermission((current) => ({ ...current, key: event.target.value.toLowerCase() }))} /></td><td className="permission-actions"><button type="button" className="table-action is-save" disabled={saving === `permission-${permission.id}`} onClick={updatePermission}>Save</button><button type="button" className="table-action" onClick={() => setEditingPermission(null)}>Cancel</button></td></tr>
                  ) : (
                    <tr key={permission.id}><td><span className="permission-name-cell"><ShieldIcon /><strong>{permission.displayName}</strong></span></td><td><code>{permission.key}</code></td><td className="permission-actions"><button type="button" className="table-action" onClick={() => setEditingPermission(permission)}>Edit</button><button type="button" className="table-action is-delete" disabled={saving === `permission-${permission.id}`} onClick={() => deletePermission(permission)}>Delete</button></td></tr>
                  ))}</tbody>
                </table>
                {!permissionsLoading && !permissions.length ? <div className="empty-permission-library">No permissions created yet.</div> : null}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
