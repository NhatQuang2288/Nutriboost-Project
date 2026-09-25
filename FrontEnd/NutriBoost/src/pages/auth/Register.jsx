import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthLayout from "@/layouts/AuthLayout";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Register() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "member", // 'member' | 'pt'
    groupCode: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const setRole = (role) => {
    if (role === form.role) return;
    setForm((f) => ({
      ...f,
      role,
      groupCode: role === "pt" ? "" : f.groupCode,
    }));
    setErrors((prev) => ({ ...prev, groupCode: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username không được để trống.";
    if (!form.email.includes("@")) e.email = "Email không hợp lệ.";
    if (form.password.length < 8) e.password = "Mật khẩu tối thiểu 8 ký tự.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Mật khẩu nhập lại không khớp.";
    if (form.role === "member" && !form.groupCode.trim())
      e.groupCode = "Vui lòng nhập mã phòng do PT cấp.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      await signUp(
        form.username,
        form.email,
        form.password,
        form.confirmPassword,
        form.role,
        form.groupCode,
      );
      navigate("/login", { replace: true });
    } catch (error) {
      const fieldErrors = error?.response?.data?.errors;
      if (fieldErrors) {
        const mapped = {};
        Object.keys(fieldErrors).forEach((k) => {
          mapped[k] = fieldErrors[k][0];
        });
        setErrors(mapped);
      } else {
        setErrors({
          global: error?.response?.data?.message || "Đăng ký thất bại.",
        });
      }
    }
  };

  return (
    <AuthLayout>
      <div
        className="rounded-2xl border px-7 py-9 sm:px-10 sm:py-11"
        style={{
          background: "rgba(255, 255, 255, 0.62)",
          borderColor: "rgba(255, 255, 255, 0.78)",
          boxShadow: "0 20px 50px rgba(23, 61, 36, 0.16)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="text-base tracking-wide font-semibold mb-3"
            style={{ color: "var(--color-brand-lime)" }}
          >
            Tham gia cùng NutriBoost
          </div>
          <h1
            className="text-5xl font-black leading-none"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-brand-heading)",
              letterSpacing: "-1.25px",
            }}
          >
            Tạo tài khoản
          </h1>
          <p
            className="text-base mt-3"
            style={{ color: "var(--color-brand-muted)" }}
          >
            Bạn muốn tham gia với vai trò nào?
          </p>
        </div>

        {/* --- Toggle chuyển đổi PT / Thành viên --- */}
        <RoleSwitch role={form.role} onChange={setRole} />

        {errors.global && (
          <div
            className="mt-6 px-4 py-3 rounded-lg text-sm border"
            style={{
              background: "rgba(216,60,77,0.08)",
              borderColor: "rgba(216,60,77,0.25)",
              color: "var(--color-brand-red)",
            }}
          >
            {errors.global}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-8">
          <FieldGroup>
            <AuthInput
              label="Username"
              id="username"
              type="text"
              placeholder="nutriboost69"
              value={form.username}
              onChange={set("username")}
              required
              autoComplete="username"
            />
            {errors.username && <FieldError>{errors.username}</FieldError>}
          </FieldGroup>

          <FieldGroup>
            <AuthInput
              label="Email"
              id="email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
            />
            {errors.email && <FieldError>{errors.email}</FieldError>}
            <FieldDescription>
              Chúng tôi sẽ chỉ dùng email này để liên hệ với bạn.
            </FieldDescription>
          </FieldGroup>

          <FieldGroup>
            <AuthInput
              label="Mật khẩu"
              id="password"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              value={form.password}
              onChange={set("password")}
              required
              autoComplete="new-password"
            />
            {errors.password && <FieldError>{errors.password}</FieldError>}
            <FieldDescription>
              Mật khẩu cần có ít nhất 8 ký tự.
            </FieldDescription>
          </FieldGroup>

          <FieldGroup>
            <AuthInput
              label="Nhập lại mật khẩu"
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              required
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <FieldError>{errors.confirmPassword}</FieldError>
            )}
            <FieldDescription>
              Vui lòng nhập lại mật khẩu để xác nhận.
            </FieldDescription>
          </FieldGroup>

          {/* --- Vùng chuyển mượt giữa 2 loại field, tuỳ theo role --- */}
          <div className="relative">
            {/* Field mã phòng — hiện khi chọn Thành viên */}
            <div
              style={{
                maxHeight: form.role === "member" ? 160 : 0,
                opacity: form.role === "member" ? 1 : 0,
                overflow: "hidden",
                transform:
                  form.role === "member"
                    ? "translateY(0)"
                    : "translateY(-8px)",
                transition:
                  "max-height 0.35s ease, opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              <FieldGroup>
                <AuthInput
                  label="Mã phòng"
                  id="groupCode"
                  type="text"
                  placeholder="NT-XXXXXXXX"
                  value={form.groupCode}
                  onChange={set("groupCode")}
                  required={form.role === "member"}
                />
                {errors.groupCode && (
                  <FieldError>{errors.groupCode}</FieldError>
                )}
                <FieldDescription>
                  Nhập mã phòng do huấn luyện viên (PT) cung cấp để tham gia.
                </FieldDescription>
              </FieldGroup>
            </div>

            {/* Thông báo — hiện khi chọn PT */}
            <div
              style={{
                maxHeight: form.role === "pt" ? 120 : 0,
                opacity: form.role === "pt" ? 1 : 0,
                overflow: "hidden",
                transform:
                  form.role === "pt" ? "translateY(0)" : "translateY(-8px)",
                transition:
                  "max-height 0.35s ease, opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              <div
                className="px-4 py-3 rounded-lg text-sm border"
                style={{
                  background: "rgba(47,168,79,0.06)",
                  borderColor: "var(--color-brand-border)",
                  color: "var(--color-brand-muted)",
                }}
              >
                Sau khi đăng ký, bạn có thể tạo phòng quản lý và nhận mã để
                chia sẻ với khách hàng.
              </div>
            </div>
          </div>

          <div className="mt-2">
            <AuthButton loading={loading}>
              {form.role === "pt" ? "Tạo Tài Khoản PT" : "Tạo Tài Khoản"}
            </AuthButton>
          </div>
        </form>

        <div
          className="mt-6 pt-6"
          style={{ borderTop: "1px solid var(--color-brand-border)" }}
        >
          <p
            className="text-center text-base"
            style={{ color: "var(--color-brand-muted)" }}
          >
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-semibold transition-colors"
              style={{ color: "var(--color-brand-lime)" }}
              onMouseEnter={(e) =>
                (e.target.style.color = "var(--color-brand-lime-dim)")
              }
              onMouseLeave={(e) =>
                (e.target.style.color = "var(--color-brand-lime)")
              }
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

// --- Toggle dạng pill, có nền trượt mượt theo lựa chọn ---
function RoleSwitch({ role, onChange }) {
  const isMember = role === "member";

  return (
    <div
      className="relative grid grid-cols-2 p-1 rounded-xl"
      style={{
        background: "var(--color-brand-surface)",
        border: "1px solid var(--color-brand-border)",
      }}
    >
      {/* Nền trượt */}
      <div
        className="absolute top-1 bottom-1 rounded-lg"
        style={{
          width: "calc(50% - 4px)",
          left: isMember ? "4px" : "calc(50% + 0px)",
          background: "var(--color-brand-lime)",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 12px rgba(47,168,79,0.25)",
        }}
      />

      <button
        type="button"
        onClick={() => onChange("member")}
        className="relative z-10 py-3 rounded-lg text-sm font-semibold transition-colors duration-200"
        style={{
          color: isMember ? "#ffffff" : "var(--color-brand-muted)",
        }}
      >
        Thành viên tập
      </button>

      <button
        type="button"
        onClick={() => onChange("pt")}
        className="relative z-10 py-3 rounded-lg text-sm font-semibold transition-colors duration-200"
        style={{
          color: !isMember ? "#ffffff" : "var(--color-brand-muted)",
        }}
      >
        Personal Trainer
      </button>
    </div>
  );
}

function FieldGroup({ children }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

function FieldError({ children }) {
  return (
    <p className="text-sm" style={{ color: "var(--color-brand-red)" }}>
      {children}
    </p>
  );
}

function FieldDescription({ children }) {
  return (
    <p
      className="text-sm leading-relaxed"
      style={{ color: "var(--color-brand-muted)" }}
    >
      {children}
    </p>
  );
}