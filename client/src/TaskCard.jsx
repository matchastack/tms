const TaskCard = ({
    task,
    onClick,
    showAppName = false,
    planDetails = null
}) => {
    const formatDate = dateString => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
        >
            <h3 className="font-semibold text-gray-900 text-xl mb-3">
                {task.Task_id}: {task.Task_name}
            </h3>

            {task.Task_plan && (
                <div className="mb-3">
                    <p className="text-sm text-indigo-700 font-semibold mb-2 inline-block rounded-full px-3 py-[3px]  bg-indigo-50">
                        {task.Task_plan}
                    </p>
                    {planDetails &&
                        planDetails.Plan_startDate &&
                        planDetails.Plan_endDate && (
                            <p className="text-gray-600 text-sm">
                                {formatDate(planDetails.Plan_startDate)} -{" "}
                                {formatDate(planDetails.Plan_endDate)}
                            </p>
                        )}
                </div>
            )}

            <p className="text-gray-500 text-sm">
                Created by: {task.Task_creator}
            </p>
        </div>
    );
};

export default TaskCard;
