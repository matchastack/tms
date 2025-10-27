import { useState, useEffect } from "react";
import axios from "axios";

const PlanModal = ({ isOpen, onClose, onSuccess, plan = null, appAcronym }) => {
    const [formData, setFormData] = useState({
        Plan_MVP_name: "",
        Plan_startDate: "",
        Plan_endDate: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEdit = !!plan;

    useEffect(() => {
        if (isOpen) {
            if (plan) {
                setFormData({
                    Plan_MVP_name: plan.Plan_MVP_name || "",
                    Plan_startDate: plan.Plan_startDate || "",
                    Plan_endDate: plan.Plan_endDate || ""
                });
            } else {
                setFormData({
                    Plan_MVP_name: "",
                    Plan_startDate: "",
                    Plan_endDate: ""
                });
            }
            setError("");
        }
    }, [isOpen, plan]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isEdit) {
                const { data } = await axios.put(
                    `/plan/${formData.Plan_MVP_name}`,
                    {
                        Plan_startDate: formData.Plan_startDate || null,
                        Plan_endDate: formData.Plan_endDate || null
                    }
                );
                if (data.success) {
                    onSuccess();
                    onClose();
                }
            } else {
                const { data } = await axios.post("/plans", {
                    Plan_MVP_name: formData.Plan_MVP_name,
                    Plan_startDate: formData.Plan_startDate || null,
                    Plan_endDate: formData.Plan_endDate || null,
                    Plan_app_Acronym: appAcronym
                });
                if (data.success) {
                    onSuccess();
                    onClose();
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save plan");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEdit ? "Edit Plan" : "Create Plan"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan Name *
                        </label>
                        <input
                            type="text"
                            name="Plan_MVP_name"
                            value={formData.Plan_MVP_name}
                            onChange={handleChange}
                            required
                            disabled={isEdit}
                            maxLength={255}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            placeholder="e.g., Sprint 1"
                        />
                        {isEdit && (
                            <p className="text-xs text-gray-500 mt-1">
                                Plan name cannot be changed
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            name="Plan_startDate"
                            value={formData.Plan_startDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            name="Plan_endDate"
                            value={formData.Plan_endDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                        >
                            {loading
                                ? "Saving..."
                                : isEdit
                                ? "Update"
                                : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PlanModal;
