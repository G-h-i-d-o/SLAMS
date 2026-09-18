import { useState } from "react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DataTable, { type Column } from "../components/ui/DataTable";
import { SelectField, TextField } from "../components/ui/FormField";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  useAdminUsers,
  useCreateUser,
  useDeleteUser,
  useToggleUserActive,
  useUpdateUserRole,
  type AdminUserProfile,
} from "../hooks/useAdminUsers";
import { fmtDate } from "../lib/utils";

type PendingAction =
  | { kind: "toggle"; user: AdminUserProfile }
  | { kind: "delete"; user: AdminUserProfile }
  | null;

export default function Users() {
  const { user: me } = useAuth();
  const { success, error } = useToast();
  const { data, isLoading, error: loadErr } = useAdminUsers();
  const create = useCreateUser();
  const updateRole = useUpdateUserRole();
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    full_name: "",
    role: "user" as "admin" | "user",
  });
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const rows = (data ?? []).slice().sort((a, b) => {
    if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  function resetForm() {
    setForm({
      email: "",
      password: "",
      confirm: "",
      full_name: "",
      role: "user",
    });
  }

  async function submit() {
    const email = form.email.trim().toLowerCase();
    const fullName = form.full_name.trim();
    const password = form.password;

    if (!email || !email.includes("@")) {
      error("Enter a valid email address");
      return;
    }
    if (password.length < 8) {
      error("Password must be at least 8 characters");
      return;
    }
    if (password !== form.confirm) {
      error("Passwords don't match");
      return;
    }

    try {
      await create.mutateAsync({
        email,
        password,
        full_name: fullName,
        role: form.role,
      });
      success(`User ${email} created`);
      setAddOpen(false);
      resetForm();
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  async function changeRole(u: AdminUserProfile, newRole: "admin" | "user") {
    if (u.id === me?.id) {
      error("You can't change your own role");
      return;
    }
    try {
      await updateRole.mutateAsync({ id: u.id, role: newRole });
      success(`${u.email} is now ${newRole}`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function confirmPending() {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === "toggle") {
        const nextState = !pending.user.is_active;
        await toggleActive.mutateAsync({
          id: pending.user.id,
          is_active: nextState,
        });
        success(
          `${pending.user.email} ${nextState ? "reactivated" : "deactivated"}`
        );
      } else {
        await deleteUser.mutateAsync(pending.user.id);
        success(`${pending.user.email} permanently deleted`);
      }
      setPending(null);
    } catch (err) {
      error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<AdminUserProfile>[] = [
    {
      key: "full_name",
      label: "Name",
      render: (r) => (
        <span className="cell-strong">
          {r.full_name || <span className="cell-sub">—</span>}
          {r.id === me?.id && (
            <span
              className="badge badge-info"
              style={{ marginLeft: 8, verticalAlign: "middle" }}
            >
              you
            </span>
          )}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (r) =>
        r.role === "admin" ? (
          <span className="badge badge-purple">Admin</span>
        ) : (
          <span className="badge badge-neutral">User</span>
        ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (r) =>
        r.is_active ? (
          <span className="badge badge-success">Active</span>
        ) : (
          <span className="badge badge-danger">Deactivated</span>
        ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (r) => <span className="cell-sub">{fmtDate(r.created_at)}</span>,
    },
  ];

  const actions = (row: AdminUserProfile) => {
    const isSelf = row.id === me?.id;
    if (isSelf) {
      return <span className="cell-sub">—</span>;
    }
    return (
      <>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            changeRole(row, row.role === "admin" ? "user" : "admin")
          }
          disabled={updateRole.isPending}
        >
          Make {row.role === "admin" ? "User" : "Admin"}
        </button>

        {row.is_active ? (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setPending({ kind: "toggle", user: row })}
            disabled={toggleActive.isPending}
          >
            Deactivate
          </button>
        ) : (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPending({ kind: "toggle", user: row })}
              disabled={toggleActive.isPending}
            >
              Reactivate
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setPending({ kind: "delete", user: row })}
              disabled={deleteUser.isPending}
              title="Permanently delete this user"
            >
              Delete
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div>
            <h3>Users</h3>
            <p>
              {rows.length} user{rows.length === 1 ? "" : "s"} in the system
            </p>
          </div>
          <div className="right">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAddOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty">Loading…</div>
        ) : loadErr ? (
          <div className="empty" style={{ color: "#b91c1c" }}>
            Error: {(loadErr as Error).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            actions={actions}
            emptyMessage="No users found."
          />
        )}
      </div>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetForm();
        }}
        title="Add User"
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
              disabled={create.isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending ? "Creating…" : "Create User"}
            </button>
          </>
        }
      >
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 11.5,
            color: "#1e40af",
            lineHeight: 1.55,
          }}
        >
          The new user will be created immediately with the password you set.
          Share the credentials with them directly — there's no email
          confirmation step.
        </div>

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
          full
          placeholder="user@example.com"
        />

        <TextField
          label="Full Name"
          value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })}
          full
          hint="Used in the dashboard greeting and audit log"
          placeholder="Jane Doe"
        />

        <TextField
          label="Password"
          type="text"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          required
          hint="Minimum 8 characters"
          placeholder="At least 8 characters"
        />

        <TextField
          label="Confirm Password"
          type="text"
          value={form.confirm}
          onChange={(v) => setForm({ ...form, confirm: v })}
          required
          placeholder="Repeat the password"
        />

        <SelectField
          label="Role"
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v as "admin" | "user" })}
          options={[
            { value: "user", label: "Standard User" },
            { value: "admin", label: "Administrator" },
          ]}
          required
          hint="Users can read all data and create metrics. Admins have full access."
        />
      </Modal>

      <ConfirmDialog
        open={!!pending}
        title={
          pending?.kind === "delete"
            ? "Delete user permanently"
            : pending?.user.is_active
            ? "Deactivate user"
            : "Reactivate user"
        }
        message={
          pending
            ? pending.kind === "delete"
              ? `Permanently delete ${pending.user.email}? This cannot be undone. ` +
                `Their auth account and profile row will be removed. ` +
                `Any audit log entries referencing them will remain, but their ID will no longer resolve.`
              : pending.user.is_active
              ? `${pending.user.email} will lose access immediately. ` +
                `Existing sessions are terminated within a minute, and future sign-ins are blocked. ` +
                `You can reactivate them any time — or permanently delete them once deactivated.`
              : `${pending.user.email} will regain full access and be able to sign in again.`
            : ""
        }
        confirmLabel={
          pending?.kind === "delete"
            ? "Delete permanently"
            : pending?.user.is_active
            ? "Deactivate"
            : "Reactivate"
        }
        danger={
          pending?.kind === "delete" || !!pending?.user.is_active
        }
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={confirmPending}
      />
    </>
  );
}