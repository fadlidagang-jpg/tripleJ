import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Home, Users, DollarSign, LogOut, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import type { Room, RoomFormData, Stats } from '../types';
import { calculateDuration, calculateRemainingTime } from '../utils';
import { getSheetData, saveRow, deleteRow, type KamarData } from '../services/googleSheetsService';

interface KosanManagementProps {
  onLogout: () => void;
  username: string;
}

const KosanManagement: React.FC<KosanManagementProps> = ({ onLogout, username }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [invoiceRoom, setInvoiceRoom] = useState<Room | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);


  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: '',
    building: '',
    floor: '',
    status: 'kosong',
    tenantName: '',
    tenantPhone: '',
    rentPrice: '',
    checkInDate: '',
    rentDuration: '',
    rentDurationUnit: 'bulan',
    notes: ''
  });

  useEffect(() => {
    syncToGoogleSheets();
  }, []);

  useEffect(() => {
    if (rooms.length > 0) {
      localStorage.setItem('kosanRooms', JSON.stringify(rooms));
    }
  }, [rooms]);

  useEffect(() => {
    let filtered = rooms;

    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(room => room.status === filterStatus);
    }

    setFilteredRooms(filtered);
  }, [searchTerm, filterStatus, rooms]);

  const stats: Stats = {
    total: rooms.length,
    occupied: rooms.filter(r => r.status === 'terisi').length,
    vacant: rooms.filter(r => r.status === 'kosong').length,
    occupancyRate: rooms.length > 0 ? ((rooms.filter(r => r.status === 'terisi').length / rooms.length) * 100).toFixed(1) : '0'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingRoom) {
        const updatedRoom = { ...formData, id: editingRoom.id };

        // Optimistic update
        setRooms(rooms.map(room =>
          room.id === editingRoom.id ? updatedRoom : room
        ));

        // Save to Google Sheet
        const kamarData: KamarData = {
          id: String(updatedRoom.id),
          nomorKamar: updatedRoom.roomNumber,
          gedung: updatedRoom.building,
          lantai: updatedRoom.floor,
          status: updatedRoom.status,
          namaPenyewa: updatedRoom.tenantName,
          noTelepon: updatedRoom.tenantPhone,
          hargaSewa: updatedRoom.rentPrice,
          tanggalMasuk: updatedRoom.checkInDate,
          durasiSewa: updatedRoom.rentDuration,
          catatan: updatedRoom.notes || ''
        };
        await saveRow('update', kamarData);

      } else {
        // eslint-disable-next-line react-hooks/purity
        const newId = Date.now();
        const newRoom: Room = {
          ...formData,
          id: newId
        };

        // Optimistic update
        setRooms([...rooms, newRoom]);

        // Save to Google Sheet
        const kamarData: KamarData = {
          id: String(newId),
          nomorKamar: newRoom.roomNumber,
          gedung: newRoom.building,
          lantai: newRoom.floor,
          status: newRoom.status,
          namaPenyewa: newRoom.tenantName,
          noTelepon: newRoom.tenantPhone,
          hargaSewa: newRoom.rentPrice,
          tanggalMasuk: newRoom.checkInDate,
          durasiSewa: newRoom.rentDuration,
          catatan: newRoom.notes || ''
        };
        await saveRow('create', kamarData);
      }

      closeModal();
      alert("Data berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data ke Google Sheets. Cek koneksi atau URL Script.");
      // Revert optimistic update if needed (omitted for brevity in this step)
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData(room);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: '',
      building: '',
      floor: '',
      status: 'kosong',
      tenantName: '',
      tenantPhone: '',
      rentPrice: '',
      checkInDate: '',
      rentDuration: '',
      rentDurationUnit: 'bulan',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kamar ini?')) {
      setIsLoading(true);
      try {
        // Optimistic update
        setRooms(rooms.filter(room => room.id !== id));

        await deleteRow(String(id));
        alert("Data berhasil dihapus!");
      } catch (error) {
        console.error(error);
        alert("Gagal menghapus data dari Google Sheets.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleShowInvoice = (room: Room) => {
    setInvoiceRoom(room);
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setInvoiceRoom(null);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncToGoogleSheets = async () => {
    // If no ID is found in env, we can fallback to prompt, but user wants auto-sync.
    // Ideally the ID is set in .env.local as verified.
    let id = import.meta.env.VITE_GOOGLE_SHEET_ID;

    // If running without env var, fallback to localStorage or empty
    if (!id) {
      id = localStorage.getItem('spreadsheetId') || '';
    }

    if (!id) {
      console.error("No Spreadsheet ID found");
      alert("Spreadsheet ID tidak ditemukan. Periksa file .env.local");
      return;
    }

    setIsLoading(true);
    try {
      const data = await getSheetData(id, 'triplej!A2:K');

      const mappedRooms: Room[] = data.map((row: KamarData) => ({
        id: parseInt(row.id) || Math.floor(Math.random() * 100000),
        roomNumber: row.nomorKamar,
        building: row.gedung,
        floor: row.lantai,
        status: (row.status.toLowerCase() === 'terisi' ? 'terisi' : 'kosong') as 'kosong' | 'terisi',
        tenantName: row.namaPenyewa,
        tenantPhone: row.noTelepon,
        rentPrice: row.hargaSewa.replace(/[^0-9]/g, ''),
        checkInDate: row.tanggalMasuk,
        rentDuration: row.durasiSewa,
        rentDurationUnit: 'bulan',
        notes: row.catatan || ''
      }));

      setRooms(mappedRooms);
      setFilteredRooms(mappedRooms);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Gagal mengambil data dari Google Sheets: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manajemen Kosan</h1>
            <p className="text-blue-100">Welcome, {username.charAt(0).toUpperCase() + username.slice(1)} | Kelola 300 kamar kosan dengan mudah</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-800 text-sm">Sedang mengambil data terbaru...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Kamar</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Home className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Terisi</p>
                <p className="text-3xl font-bold text-green-600">{stats.occupied}</p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Kosong</p>
                <p className="text-3xl font-bold text-orange-600">{stats.vacant}</p>
              </div>
              <Home className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Tingkat Hunian</p>
                <p className="text-3xl font-bold text-blue-600">{stats.occupancyRate}%</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari nomor kamar, gedung, atau nama penyewa..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="kosong">Kosong</option>
              <option value="terisi">Terisi</option>
            </select>

            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Tambah Kamar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Kamar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gedung</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lantai</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penyewa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sudah Sewa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontrak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sisa Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRooms.map((room) => {
                  const remaining = room.status === 'terisi' ? calculateRemainingTime(room.checkInDate, room.rentDuration, room.rentDurationUnit) : null;

                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{room.roomNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{room.building}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{room.floor}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${room.status === 'terisi'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                          }`}>
                          {room.status === 'terisi' ? 'Terisi' : 'Kosong'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {room.tenantName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {room.status === 'terisi' ? calculateDuration(room.checkInDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {room.rentDuration && room.status === 'terisi' ? `${room.rentDuration} ${room.rentDurationUnit}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {remaining ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${remaining.expired
                            ? 'bg-red-100 text-red-800'
                            : remaining.warning
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {remaining.text}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        Rp {parseInt(room.rentPrice || '0').toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowInvoice(room)}
                            className="text-green-600 hover:text-green-800"
                            title="Lihat Invoice"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(room)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => !isLoading && handleDelete(room.id)}
                            className={`text-red-600 hover:text-red-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Tidak ada data kamar yang ditemukan
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRoom ? 'Edit Kamar' : 'Tambah Kamar Baru'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Kamar *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gedung *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lantai *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'kosong' | 'terisi' })}
            >
              <option value="kosong">Kosong</option>
              <option value="terisi">Terisi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Sewa (Rp) *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.rentPrice ? parseInt(formData.rentPrice).toLocaleString('de-DE') : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\./g, ''); // Remove dots
                if (value === '' || /^\d+$/.test(value)) { // Only allow numbers
                  setFormData({ ...formData, rentPrice: value });
                }
              }}
            />
          </div>

          {formData.status === 'terisi' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penyewa</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tenantPhone}
                  onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Kontrak Sewa</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Jumlah"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rentDuration}
                    onChange={(e) => setFormData({ ...formData, rentDuration: e.target.value })}
                  />
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rentDurationUnit}
                    onChange={(e) => setFormData({ ...formData, rentDurationUnit: e.target.value as 'hari' | 'bulan' | 'tahun' })}
                  >
                    <option value="hari">Hari</option>
                    <option value="bulan">Bulan</option>
                    <option value="tahun">Tahun</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {editingRoom ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              editingRoom ? 'Update' : 'Simpan'
            )}
          </button>
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={closeInvoiceModal}
        title="Invoice Pembayaran Sewa"
      >
        {invoiceRoom && (
          <div id="invoice-content" className="space-y-6">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">TRIPLE J KOSAN</h2>
              <p className="text-sm text-gray-600 mt-1">Invoice Pembayaran Sewa Kamar</p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nomor Kamar</p>
                <p className="font-semibold text-gray-800">{invoiceRoom.roomNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gedung / Lantai</p>
                <p className="font-semibold text-gray-800">{invoiceRoom.building} / {invoiceRoom.floor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nama Penyewa</p>
                <p className="font-semibold text-gray-800">{invoiceRoom.tenantName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">No. Telepon</p>
                <p className="font-semibold text-gray-800">{invoiceRoom.tenantPhone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tanggal Masuk</p>
                <p className="font-semibold text-gray-800">{invoiceRoom.checkInDate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durasi Sewa</p>
                <p className="font-semibold text-gray-800">{invoiceRoom.rentDuration} {invoiceRoom.rentDurationUnit}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-700">Total Pembayaran:</span>
                <span className="text-2xl font-bold text-blue-600">
                  Rp {parseInt(invoiceRoom.rentPrice || '0').toLocaleString('de-DE')}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">Catatan:</p>
              <p className="text-gray-800 mt-1">{invoiceRoom.notes || '-'}</p>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
              <p>Terima kasih atas pembayaran Anda</p>
              <p className="mt-1">Tanggal cetak: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={closeInvoiceModal}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Cetak Invoice
          </button>
        </div>
      </Modal>
    </div >
  );
};

export default KosanManagement;