"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/LangContext";

interface Profile {
  age?: number; gender?: string; height?: number; weight?: number;
  goalWeight?: number; activityLevel?: string; healthConditions?: string;
  bmr?: number; tdee?: number; dailyTarget?: number;
  proteinTarget?: number; fatTarget?: number; carbsTarget?: number;
}

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light (1-3x/wk)" },
  { value: "moderate", label: "Moderate (3-5x/wk)" },
  { value: "active", label: "Active (6-7x/wk)" },
  { value: "very_active", label: "Very Active" },
];

export default function ProfilePage() {
  const { t } = useT();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => { if (!d.error) setProfile(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    if (res.ok) { const u = await res.json(); setProfile(u); setMessage(t.profile.saved); setTimeout(() => setMessage(""), 3000); }
    else setMessage("Error");
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.profile.title}</h1>
      {message && <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-600">{message}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.age}</label>
            <input type="number" value={profile.age || ""} onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="25" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.gender}</label>
            <select value={profile.gender || ""} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
              <option value="">Select</option><option value="male">{t.profile.male}</option><option value="female">{t.profile.female}</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.height}</label>
            <input type="number" value={profile.height || ""} onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="170" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.weight}</label>
            <input type="number" value={profile.weight || ""} onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="65" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.goalWeight}</label>
          <input type="number" value={profile.goalWeight || ""} onChange={(e) => setProfile({ ...profile, goalWeight: parseFloat(e.target.value) || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="60" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.activity}</label>
          <select value={profile.activityLevel || ""} onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            <option value="">Select</option>
            {ACTIVITY_LEVELS.map((al) => (<option key={al.value} value={al.value}>{al.label}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.profile.healthTitle}</label>
          <div className="space-y-2">
            {[
              { value: 'diabetes', label: t.profile.diabetes, desc: t.profile.diabetesDesc },
              { value: 'high_cholesterol', label: t.profile.cholesterol, desc: t.profile.cholesterolDesc },
              { value: 'hypertension', label: t.profile.hypertension, desc: t.profile.hypertensionDesc },
            ].map((cond) => {
              const selected = (profile.healthConditions || '').split(',').filter(Boolean);
              const isChecked = selected.includes(cond.value);
              return (
                <label key={cond.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${isChecked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={isChecked} onChange={(e) => {
                    const ns = e.target.checked ? [...selected, cond.value] : selected.filter(s => s !== cond.value);
                    setProfile({ ...profile, healthConditions: ns.join(',') });
                  }} className="mt-0.5" />
                  <div><div className="text-sm font-medium text-gray-800">{cond.label}</div><div className="text-xs text-gray-400">{cond.desc}</div></div>
                </label>
              );
            })}
          </div>
        </div>

        {profile.dailyTarget && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 text-sm">Targets</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">{t.profile.bmr}:</span> <span className="font-medium">{Math.round(profile.bmr || 0)} kcal</span></div>
              <div><span className="text-gray-500">{t.profile.tdee}:</span> <span className="font-medium">{Math.round(profile.tdee || 0)} kcal</span></div>
              <div><span className="text-gray-500">{t.profile.dailyTarget}:</span> <span className="font-medium text-emerald-600">{Math.round(profile.dailyTarget || 0)} kcal</span></div>
              <div><span className="text-gray-500">{t.profile.proteinTarget}:</span> <span className="font-medium">{profile.proteinTarget}g</span></div>
              <div><span className="text-gray-500">{t.profile.fatTarget}:</span> <span className="font-medium">{profile.fatTarget}g</span></div>
              <div><span className="text-gray-500">{t.profile.carbsTarget}:</span> <span className="font-medium">{profile.carbsTarget}g</span></div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {saving ? t.profile.saving : t.profile.save}
        </button>
      </form>
    </div>
  );
}
