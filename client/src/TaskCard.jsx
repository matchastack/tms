const TaskCard = ({ task, onClick, showAppName = false }) => {
    const getStateColor = (state) => {
        const colors = {
            "Open": "bg-gray-200 text-gray-800",
            "To-Do": "bg-blue-200 text-blue-800",
            "Doing": "bg-yellow-200 text-yellow-800",
            "Done": "bg-green-200 text-green-800",
            "Closed": "bg-purple-200 text-purple-800"
        };
        return colors[state] || "bg-gray-200 text-gray-800";
    };

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-gray-500">
                    {task.Task_id}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStateColor(task.Task_state)}`}>
                    {task.Task_state}
                </span>
            </div>

            {showAppName && (
                <div className="flex items-center gap-1 mb-2">
                    <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-xs text-purple-600 font-medium">
                        {task.Task_app_Acronym}
                    </span>
                </div>
            )}

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {task.Task_name}
            </h3>

            {task.Task_description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {task.Task_description}
                </p>
            )}

            {task.Task_plan && (
                <div className="flex items-center gap-1 mb-2">
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-xs text-blue-600 font-medium">
                        {task.Task_plan}
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-gray-600">
                        {task.Task_owner}
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    {new Date(task.Task_createDate).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

export default TaskCard;
