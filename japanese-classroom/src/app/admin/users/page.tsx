"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "../../../components/auth/AdminGuard";
import { Header } from "../../../components/ui";
import { Breadcrumb } from "../../../components/admin";
import { usersApi, type User } from "../../../api/users-api";
import { Calendar, Save, X } from "lucide-react";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message || "Không thể tải danh sách người dùng");
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleEditClick(user: User) {
    setEditingUserId(user.id);
    // Format date for input (YYYY-MM-DD)
    if (user.courseStartDate) {
      const date = new Date(user.courseStartDate);
      const formattedDate = date.toISOString().split("T")[0];
      setEditingDate(formattedDate);
    } else {
      // Default to today
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      setEditingDate(formattedDate);
    }
  }

  function handleCancelEdit() {
    setEditingUserId(null);
    setEditingDate("");
  }

  async function handleSave(userId: string) {
    if (!editingDate) {
      alert("Vui lòng chọn ngày bắt đầu khóa học");
      return;
    }

    try {
      setSaving(true);
      await usersApi.updateUser(userId, {
        courseStartDate: editingDate,
      });
      await loadUsers();
      setEditingUserId(null);
      setEditingDate("");
    } catch (err) {
      alert((err as Error).message || "Không thể cập nhật ngày bắt đầu");
      console.error("Failed to update user:", err);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return "Chưa đặt";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <AdminGuard>
      <main className="w-full min-h-screen bg-gradient-to-b from-sky-200 to-blue-100">
        <Header />
        <div className="pt-20 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb
              items={[
                { label: "Admin", href: "/admin" },
                { label: "Quản lý người dùng" },
              ]}
            />
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#5C4A37] mb-2">
                Quản lý người dùng
              </h1>
              <p className="text-gray-600">
                Quản lý ngày bắt đầu khóa học cho từng người dùng
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                  <p>Đang tải danh sách người dùng...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  Không có người dùng nào
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên hiển thị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vai trò
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày bắt đầu khóa học
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.displayName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {user.role === "admin" ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {editingUserId === user.id ? (
                              <input
                                type="date"
                                value={editingDate}
                                onChange={(e) => setEditingDate(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                disabled={saving}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                {formatDate(user.courseStartDate)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {editingUserId === user.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSave(user.id)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Save size={14} />
                                  {saving ? "Đang lưu..." : "Lưu"}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                  <X size={14} />
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(user)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Đặt ngày bắt đầu
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📝 Lưu ý về ngày bắt đầu khóa học
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Ngày bắt đầu khóa học xác định nội dung học tập hàng ngày
                  cho người dùng
                </li>
                <li>
                  • Mỗi ngày điểm danh sẽ mở khóa 10 từ vựng, 5 kanji và 1 điểm
                  ngữ pháp mới
                </li>
                <li>
                  • Nếu người dùng bỏ lỡ ngày điểm danh, họ sẽ không nhận được
                  nội dung của ngày đó
                </li>
                <li>
                  • Người dùng cần đặt ngày bắt đầu khóa học trước khi có thể
                  điểm danh
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
