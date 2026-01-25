export var ServiceStatusId;
(function (ServiceStatusId) {
    ServiceStatusId["Created"] = "1";
    ServiceStatusId["Pending"] = "2";
    ServiceStatusId["Approved"] = "3";
    ServiceStatusId["Rejected"] = "4";
    ServiceStatusId["Completed"] = "5";
    ServiceStatusId["Finished"] = "6";
})(ServiceStatusId || (ServiceStatusId = {}));
const chatEnabledStatuses = new Set([
    ServiceStatusId.Approved,
    ServiceStatusId.Completed,
]);
export const isChatOpenStatus = (statusId) => {
    if (!statusId) {
        return false;
    }
    return chatEnabledStatuses.has(statusId);
};
