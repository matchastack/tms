const TaskCard = ({ task, onClick, showAppName = false }) => {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {task.Task_id}: {task.Task_name}
                </h3>
            </div>

            {task.Task_description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {task.Task_description}
                </p>
            )}

            {task.Task_plan && (
                <div className="flex items-center gap-1 mb-2">
                    <svg
                        className="w-3 h-3 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <span className="text-xs text-blue-600 font-medium">
                        {task.Task_plan}
                    </span>
                </div>
            )}
            <div className="text-xs text-gray-400">
                {new Date(task.Task_createDate).toLocaleDateString()}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1">
                    <svg
                        className="w-3 h-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                    <span className="text-xs text-gray-600">
                        {task.Task_owner}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
