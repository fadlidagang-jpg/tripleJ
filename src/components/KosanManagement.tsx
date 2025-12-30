import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Home, Users, DollarSign, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import type { Room, RoomFormData, Stats } from '../types';
import { calculateDuration, calculateRemainingTime } from '../utils';

const KosanManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
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
    const savedRooms = localStorage.getItem('kosanRooms');
    if (savedRooms) {
      const parsedRooms: Room[] = JSON.parse(savedRooms);
      setRooms(parsedRooms);
      setFilteredRooms(parsedRooms);
    } else {
      const sampleData: Room[] = [
        { id: 1, roomNumber: '101', building: 'A', floor: '1', status: 'terisi', tenantName: 'Budi Santoso', tenantPhone: '081234567890', rentPrice: '1500000', checkInDate: '2024-01-15', rentDuration: '6', rentDurationUnit: 'bulan', notes: '' },
        { id: 2, roomNumber: '102', building: 'A', floor: '1', status: 'kosong', tenantName: '', tenantPhone: '', rentPrice: '1500000', checkInDate: '', rentDuration: '', rentDurationUnit: 'bulan', notes: '' },
        { id: 3, roomNumber: '201', building: 'A', floor: '2', status: 'terisi', tenantName: 'Siti Nurhaliza', tenantPhone: '082345678901', rentPrice: '1800000', checkInDate: '2024-02-01', rentDuration: '12', rentDurationUnit: 'bulan', notes: '' },
        { id: 4, roomNumber: '103', building: 'A', floor: '1', status: 'kosong', tenantName: '', tenantPhone: '', rentPrice: '1500000', checkInDate: '', rentDuration: '', rentDurationUnit: 'bulan', notes: '' },
        { id: 5, roomNumber: '202', building: 'A', floor: '2', status: 'terisi', tenantName: 'Ahmad Hidayat', tenantPhone: '083456789012', rentPrice: '1800000', checkInDate: '2024-11-20', rentDuration: '3', rentDurationUnit: 'bulan', notes: 'Sudah bayar 3 bulan' }
      ];
      setRooms(sampleData);
      setFilteredRooms(sampleData);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRoom) {
      setRooms(rooms.map(room => 
        room.id === editingRoom.id ? { ...formData, id: room.id } : room
      ));
    } else {
      const newRoom: Room = {
        ...formData,
        id: Date.now()
      };
      setRooms([...rooms, newRoom]);
    }
    
    closeModal();
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

  const handleDelete = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kamar ini?')) {
      setRooms(rooms.filter(room => room.id !== id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const syncToGoogleSheets = () => {
    alert('Fitur sync ke Google Sheets akan segera aktif!\n\nUntuk mengaktifkan:\n1. Setup Google Sheets API\n2. Tambahkan credentials\n3. Aplikasi akan otomatis sync');
    setIsConnected(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Manajemen Kosan</h1>
          <p className="text-blue-100">Kelola 300 kamar kosan dengan mudah</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!isConnected && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-yellow-800 text-sm">
                <strong>Belum terhubung ke Google Sheets.</strong> Saat ini data disimpan di browser Anda.
              </p>
              <button 
                onClick={syncToGoogleSheets}
                className="mt-2 text-sm bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700"
              >
                Hubungkan ke Google Sheets
              </button>
            </div>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        room.status === 'terisi' 
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          remaining.expired 
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
                      Rp {parseInt(room.rentPrice || '0').toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(room)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="text-red-600 hover:text-red-800"
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
              onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
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
                onChange={(e) => setFormData({...formData, building: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lantai *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.floor}
                onChange={(e) => setFormData({...formData, floor: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'kosong' | 'terisi'})}
            >
              <option value="kosong">Kosong</option>
              <option value="terisi">Terisi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Sewa (Rp) *</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.rentPrice}
              onChange={(e) => setFormData({...formData, rentPrice: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tenantPhone}
                  onChange={(e) => setFormData({...formData, tenantPhone: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, rentDuration: e.target.value})}
                  />
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rentDurationUnit}
                    onChange={(e) => setFormData({...formData, rentDurationUnit: e.target.value as 'hari' | 'bulan' | 'tahun'})}
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
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={closeModal}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {editingRoom ? 'Update' : 'Simpan'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default KosanManagement;