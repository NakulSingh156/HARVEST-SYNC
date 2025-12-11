
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const OrderManager = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch Orders
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/orders/farmer/?username=${user.username}`);
                setOrders(response.data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user.username, refreshTrigger]);

    // Handle Status Update
    const updateStatus = async (orderId, newStatus) => {
        // Optimistic UI update could be done here, but let's be safe and wait for server
        try {
            await axios.post('/api/orders/update/', {
                order_id: orderId,
                status: newStatus
            });
            // Trigger refresh
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status. Please try again.");
        }
    };

    if (loading) return <div className="text-center py-10">Loading orders...</div>;

    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const activeOrders = orders.filter(o => ['Confirmed', 'Packed', 'Shipped'].includes(o.status));
    const completedOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));

    return (
        <div className="space-y-8 animate-fade-in-down">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">📦 Order Manager</h2>
                <p className="text-gray-600">Manage incoming orders and track deliveries.</p>
            </div>

            {/* SECTION 1: NEW ORDERS (PENDING) */}
            <div className="bg-white rounded-lg shadow-md border border-yellow-200 overflow-hidden">
                <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100 flex justify-between items-center">
                    <h3 className="font-bold text-yellow-800 flex items-center">
                        <span className="mr-2">🔔</span> New Orders ({pendingOrders.length})
                    </h3>
                </div>
                <div className="p-6">
                    {pendingOrders.length === 0 ? (
                        <p className="text-gray-500 italic">No new orders at the moment.</p>
                    ) : (
                        <div className="grid gap-4">
                            {pendingOrders.map(order => (
                                <div key={order.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-center bg-white hover:bg-gray-50 transition">
                                    <div className="mb-4 md:mb-0">
                                        <h4 className="font-bold text-lg text-gray-800">{order.crop_name}</h4>
                                        <p className="text-sm text-gray-600">
                                            Qty: <strong>{order.quantity_kg.toFixed(1)} kg</strong> • Price: <span className="text-green-600 font-bold">₹{order.total_price.toFixed(2)}</span>
                                        </p>
                                        <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                            <p>👤 <strong>Buyer:</strong> {order.buyer_name} ({order.buyer_phone})</p>
                                            <p>📍 <strong>Dest:</strong> {order.buyer_address}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => updateStatus(order.id, 'Cancelled')}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 font-medium transition"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => updateStatus(order.id, 'Confirmed')}
                                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow transition"
                                        >
                                            Accept Order
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 2: ACTIVE ORDERS */}
            <div className="bg-white rounded-lg shadow-md border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                    <h3 className="font-bold text-blue-800 flex items-center">
                        <span className="mr-2">🚚</span> Active Deliveries ({activeOrders.length})
                    </h3>
                </div>
                <div className="p-6">
                    {activeOrders.length === 0 ? (
                        <p className="text-gray-500 italic">No active orders being processed.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activeOrders.map(order => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{order.crop_name}</div>
                                                <div className="text-sm text-gray-500">{order.quantity_kg} kg</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{order.buyer_name || "Unknown Buyer"}</div>
                                                <div className="text-xs text-gray-500">{order.buyer_phone || "No Phone"}</div>
                                                <div className="text-xs text-gray-400 mt-1 italic">📍 {order.buyer_address || "No Address"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{order.buyer_city || "Unknown City"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'Packed' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <select
                                                    className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                >
                                                    <option value="Confirmed" disabled>Confirmed</option>
                                                    <option value="Packed">Mark Packed</option>
                                                    <option value="Shipped">Mark Shipped</option>
                                                    <option value="Delivered">Mark Delivered</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 3: COMPLETED */}
            {completedOrders.length > 0 && (
                <div className="mt-8">
                    <h3 className="font-bold text-gray-600 mb-4">Completed History</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                        {completedOrders.map(o => (
                            <div key={o.id} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                                <span>Order #{o.id} - {o.crop_name}</span>
                                <span className={o.status === 'Delivered' ? 'text-green-600' : 'text-red-500'}>{o.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManager;
