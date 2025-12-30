"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "../../../components/auth/AdminGuard";
import { Header } from "../../../components/ui";
import { Breadcrumb } from "../../../components/admin";
import { adminApi, type LimitLearningSettings } from "../../../api/admin-api";
import { Save, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<LimitLearningSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    vocab: 10,
    kanji: 5,
    grammar: 1,
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getLimitLearning();
      setSettings(data);
      setFormData({
        vocab: data.limits.vocab,
        kanji: data.limits.kanji,
        grammar: data.limits.grammar,
        isActive: data.isActive,
      });
    } catch (err) {
      setError((err as Error).message || "Không thể tải cài đặt");
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (formData.vocab < 1 || formData.vocab > 100) {
      alert("Số từ vựng phải từ 1 đến 100");
      return;
    }
    if (formData.kanji < 1 || formData.kanji > 50) {
      alert("Số kanji phải từ 1 đến 50");
      return;
    }
    if (formData.grammar < 1 || formData.grammar > 10) {
      alert("Số ngữ pháp phải từ 1 đến 10");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const updated = await adminApi.updateLimitLearning(formData);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || "Không thể cập nhật cài đặt");
      console.error("Failed to update settings:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGuard>
      <main className="w-full min-h-screen bg-gradient-to-b from-sky-200 to-blue-100">
        <Header />
        <div className="pt-20 px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb
              items={[{ label: "Admin", href: "/admin" }, { label: "Cài đặt" }]}
            />
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#5C4A37] mb-2">
                Cài đặt hệ thống
              </h1>
              <p className="text-gray-600">
                Quản lý giới hạn học tập hàng ngày cho tất cả người dùng
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                Cài đặt đã được lưu thành công!
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <span className="ml-3 text-gray-600">
                    Đang tải cài đặt...
                  </span>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#5C4A37] mb-4">
                      Giới hạn học tập hàng ngày
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Cài đặt số lượng từ vựng, kanji và ngữ pháp được unlock
                      mỗi khi người dùng điểm danh. Cài đặt này áp dụng cho tất
                      cả người dùng.
                    </p>

                    <div className="space-y-6">
                      {/* Vocab Limit */}
                      <div>
                        <label
                          htmlFor="vocab"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Số từ vựng mỗi ngày
                        </label>
                        <input
                          type="number"
                          id="vocab"
                          min="1"
                          max="100"
                          value={formData.vocab}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              vocab: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={saving}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Giới hạn: 1 - 100 từ vựng
                        </p>
                      </div>

                      {/* Kanji Limit */}
                      <div>
                        <label
                          htmlFor="kanji"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Số kanji mỗi ngày
                        </label>
                        <input
                          type="number"
                          id="kanji"
                          min="1"
                          max="50"
                          value={formData.kanji}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              kanji: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={saving}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Giới hạn: 1 - 50 kanji
                        </p>
                      </div>

                      {/* Grammar Limit */}
                      <div>
                        <label
                          htmlFor="grammar"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Số điểm ngữ pháp mỗi ngày
                        </label>
                        <input
                          type="number"
                          id="grammar"
                          min="1"
                          max="10"
                          value={formData.grammar}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              grammar: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                          disabled={saving}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Giới hạn: 1 - 10 điểm ngữ pháp
                        </p>
                      </div>

                      {/* Active Toggle */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                isActive: e.target.checked,
                              })
                            }
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={saving}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Kích hoạt cài đặt này
                          </span>
                        </label>
                        <p className="mt-1 text-sm text-gray-500 ml-8">
                          Nếu tắt, hệ thống sẽ sử dụng giá trị mặc định (10
                          vocab, 5 kanji, 1 grammar)
                        </p>
                      </div>
                    </div>
                  </div>

                  {settings && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Cài đặt hiện tại:
                      </p>
                      <div className="text-sm text-gray-800 space-y-1">
                        <p>
                          • Từ vựng: <strong>{settings.limits.vocab}</strong>
                        </p>
                        <p>
                          • Kanji: <strong>{settings.limits.kanji}</strong>
                        </p>
                        <p>
                          • Ngữ pháp: <strong>{settings.limits.grammar}</strong>
                        </p>
                        <p>
                          • Trạng thái:{" "}
                          <strong>
                            {settings.isActive ? "Đang kích hoạt" : "Đã tắt"}
                          </strong>
                        </p>
                        {settings.updatedAt && (
                          <p className="text-gray-500 mt-2">
                            Cập nhật lần cuối:{" "}
                            {new Date(settings.updatedAt).toLocaleString(
                              "vi-VN"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Save size={20} />
                      )}
                      {saving ? "Đang lưu..." : "Lưu cài đặt"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                ℹ️ Lưu ý về cài đặt
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Cài đặt này áp dụng cho tất cả người dùng khi họ điểm danh
                </li>
                <li>
                  • Thay đổi sẽ có hiệu lực ngay lập tức cho các lần điểm danh
                  mới
                </li>
                <li>
                  • Các người dùng đã điểm danh trong ngày sẽ giữ nguyên giới
                  hạn của ngày đó
                </li>
                <li>• Nếu tắt cài đặt, hệ thống sẽ sử dụng giá trị mặc định</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
