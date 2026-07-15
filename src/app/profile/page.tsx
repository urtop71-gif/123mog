"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useT } from "@/lib/LangContext";
import { useToast } from "@/components/Toast";

interface Profile {
  name?: string | null;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goalWeight?: number;
  activityLevel?: string;
  healthConditions?: string;
  bmr?: number;
  tdee?: number;
  dailyTarget?: number;
  proteinTarget?: number;
  fatTarget?: number;
  carbsTarget?: number;
  sodiumTarget?: number;
  targetsManual?: boolean;
  waterTargetMl?: number;
}

export default function ProfilePage() {
  const { t } = useT();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weightLogs, setWeightLogs] = useState<{ date: string; weight: number }[]>([]);

  const activityOptions = [
    { value: "sedentary", label: t.profile.activitySedentary },
    { value: "light", label: t.profile.activityLight },
    { value: "moderate", label: t.profile.activityModerate },
    { value: "active", label: t.profile.activityActive },
    { value: "very_active", label: t.profile.activityVeryActive },
  ];

  useEffect(() => {
    Promise.all([fetch("/api/user/profile"), fetch("/api/weight?limit=14")])
      .then(async ([p, w]) => {
        if (p.ok) {
          const d = await p.json();
          if (!d.error) setProfile(d);
        }
        if (w.ok) setWeightLogs(await w.json());
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      const u = await res.json();
      setProfile(u);
      toast(t.profile.saved);
    } else {
      toast(t.common.error, "error");
    }
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (!confirm(t.profile.deleteAccountConfirm)) return;
    const res = await fetch("/api/user/profile", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400 dark:text-gray-500">{t.common.loading}</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t.profile.title}</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.profile.name}
          </label>
          <input
            type="text"
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.profile.age}
            </label>
            <input
              type="number"
              value={profile.age || ""}
              onChange={(e) =>
                setProfile({ ...profile, age: parseInt(e.target.value) || undefined })
              }
              className="input-field"
              placeholder="25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.profile.gender}
            </label>
            <select
              value={profile.gender || ""}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="input-field"
            >
              <option value="">{t.common.select}</option>
              <option value="male">{t.profile.male}</option>
              <option value="female">{t.profile.female}</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.profile.height}
            </label>
            <input
              type="number"
              value={profile.height || ""}
              onChange={(e) =>
                setProfile({ ...profile, height: parseFloat(e.target.value) || undefined })
              }
              className="input-field"
              placeholder="170"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.profile.weight}
            </label>
            <input
              type="number"
              value={profile.weight || ""}
              onChange={(e) =>
                setProfile({ ...profile, weight: parseFloat(e.target.value) || undefined })
              }
              className="input-field"
              placeholder="65"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.profile.goalWeight}
          </label>
          <input
            type="number"
            value={profile.goalWeight || ""}
            onChange={(e) =>
              setProfile({ ...profile, goalWeight: parseFloat(e.target.value) || undefined })
            }
            className="input-field"
            placeholder="60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.profile.activity}
          </label>
          <select
            value={profile.activityLevel || ""}
            onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
            className="input-field"
          >
            <option value="">{t.common.select}</option>
            {activityOptions.map((al) => (
              <option key={al.value} value={al.value}>
                {al.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.profile.healthTitle}
          </label>
          <div className="space-y-2">
            {[
              { value: "diabetes", label: t.profile.diabetes, desc: t.profile.diabetesDesc },
              {
                value: "high_cholesterol",
                label: t.profile.cholesterol,
                desc: t.profile.cholesterolDesc,
              },
              {
                value: "hypertension",
                label: t.profile.hypertension,
                desc: t.profile.hypertensionDesc,
              },
            ].map((cond) => {
              const selected = (profile.healthConditions || "").split(",").filter(Boolean);
              const isChecked = selected.includes(cond.value);
              return (
                <label
                  key={cond.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    isChecked
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const ns = e.target.checked
                        ? [...selected, cond.value]
                        : selected.filter((s) => s !== cond.value);
                      setProfile({ ...profile, healthConditions: ns.join(",") });
                    }}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {cond.label}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{cond.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!profile.targetsManual}
            onChange={(e) => setProfile({ ...profile, targetsManual: e.target.checked })}
          />
          <span>
            <span className="font-medium">{t.profile.manualTargets}</span>
            <span className="block text-xs text-gray-400">{t.profile.manualTargetsHint}</span>
          </span>
        </label>

        {(profile.dailyTarget || profile.targetsManual) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              {t.profile.targets}
            </h3>
            {!profile.targetsManual ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">{t.profile.bmr}:</span>{" "}
                  <span className="font-medium">{Math.round(profile.bmr || 0)} kcal</span>
                </div>
                <div>
                  <span className="text-gray-500">{t.profile.tdee}:</span>{" "}
                  <span className="font-medium">{Math.round(profile.tdee || 0)} kcal</span>
                </div>
                <div>
                  <span className="text-gray-500">{t.profile.dailyTarget}:</span>{" "}
                  <span className="font-medium text-emerald-600">
                    {Math.round(profile.dailyTarget || 0)} kcal
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t.profile.proteinTarget}:</span>{" "}
                  <span className="font-medium">{profile.proteinTarget}g</span>
                </div>
                <div>
                  <span className="text-gray-500">{t.profile.fatTarget}:</span>{" "}
                  <span className="font-medium">{profile.fatTarget}g</span>
                </div>
                <div>
                  <span className="text-gray-500">{t.profile.carbsTarget}:</span>{" "}
                  <span className="font-medium">{profile.carbsTarget}g</span>
                </div>
                {profile.sodiumTarget && (
                  <div>
                    <span className="text-gray-500">{t.profile.sodiumTarget}:</span>{" "}
                    <span className="font-medium">{Math.round(profile.sodiumTarget)}mg</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="input-field"
                  placeholder={t.profile.dailyTarget}
                  value={profile.dailyTarget ?? ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      dailyTarget: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder={t.profile.proteinTarget}
                  value={profile.proteinTarget ?? ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      proteinTarget: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder={t.profile.fatTarget}
                  value={profile.fatTarget ?? ""}
                  onChange={(e) =>
                    setProfile({ ...profile, fatTarget: parseFloat(e.target.value) || undefined })
                  }
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder={t.profile.carbsTarget}
                  value={profile.carbsTarget ?? ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      carbsTarget: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder={t.profile.sodiumTarget}
                  value={profile.sodiumTarget ?? ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      sodiumTarget: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500">{t.profile.waterTarget}</label>
              <input
                type="number"
                className="input-field mt-1"
                value={profile.waterTargetMl ?? 2000}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    waterTargetMl: parseInt(e.target.value) || 2000,
                  })
                }
              />
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full btn-primary">
          {saving ? t.profile.saving : t.profile.save}
        </button>
      </form>

      {weightLogs.length > 0 && (
        <div className="card p-6 mt-6">
          <h2 className="font-semibold mb-3">{t.profile.weightHistory}</h2>
          <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
            {weightLogs.map((l) => (
              <li key={l.date} className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>{l.date}</span>
                <span className="font-medium">{l.weight} kg</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ChangePasswordForm />

      <HealthSyncSection />

      <div className="card p-6 mt-6 border-red-200 dark:border-red-900">
        <h2 className="font-semibold text-red-600 mb-2">{t.profile.deleteAccount}</h2>
        <button onClick={deleteAccount} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
          {t.profile.deleteAccountBtn}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const { t } = useT();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast(t.profile.passwordMismatch, "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/user/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (res.ok) {
      toast(t.profile.passwordChanged);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      toast(
        data.error === "invalid_current_password"
          ? t.profile.currentPasswordWrong
          : data.error || t.common.error,
        "error",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 mt-6">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t.profile.changePassword}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t.profile.currentPassword}
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t.profile.newPassword}
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t.profile.confirmNewPassword}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="input-field"
        />
      </div>
      <button type="submit" disabled={saving} className="w-full py-2.5 bg-gray-800 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50">
        {saving ? t.profile.saving : t.profile.changePasswordBtn}
      </button>
    </form>
  );
}

function HealthSyncSection() {
  const { t } = useT();
  const { toast } = useToast();
  const [hasToken, setHasToken] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/user/health-token")
      .then((r) => r.json())
      .then((d) => setHasToken(!!d.hasToken))
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    if (hasToken && !confirm(t.profile.regenerateTokenConfirm)) return;
    setBusy(true);
    const res = await fetch("/api/user/health-token", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setNewToken(d.token);
      setHasToken(true);
    } else {
      toast(t.common.error, "error");
    }
  };

  const revoke = async () => {
    if (!confirm(t.profile.revokeTokenConfirm)) return;
    setBusy(true);
    const res = await fetch("/api/user/health-token", { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setHasToken(false);
      setNewToken(null);
      toast(t.profile.saved);
    } else {
      toast(t.common.error, "error");
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast(t.profile.copied);
  };

  if (loading) return null;

  const syncUrl = `${origin}/api/integrations/health-sync`;

  return (
    <div className="card p-6 mt-6 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t.profile.healthSyncTitle}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t.profile.healthSyncDesc}</p>

      {newToken ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">{t.profile.tokenShownOnce}</p>
          <div className="flex gap-2">
            <code className="input-field flex-1 overflow-x-auto text-xs py-2">{newToken}</code>
            <button
              type="button"
              onClick={() => copy(newToken)}
              className="btn-primary px-3 whitespace-nowrap"
            >
              {t.profile.copy}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {hasToken ? t.profile.tokenActive : t.profile.tokenNone}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={generate} disabled={busy} className="btn-primary px-3">
          {hasToken ? t.profile.regenerateToken : t.profile.generateToken}
        </button>
        {hasToken && (
          <button
            type="button"
            onClick={revoke}
            disabled={busy}
            className="px-3 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-medium"
          >
            {t.profile.revokeToken}
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
        <p className="font-medium text-gray-700 dark:text-gray-300">{t.profile.shortcutStepsTitle}</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>{t.profile.shortcutStep1}</li>
          <li>{t.profile.shortcutStep2}</li>
          <li>
            {t.profile.shortcutStep3}:{" "}
            <span className="break-all font-mono text-[11px]">{syncUrl}</span>
          </li>
          <li>{t.profile.shortcutStep4}</li>
          <li>{t.profile.shortcutStep5}</li>
        </ol>
      </div>
    </div>
  );
}
