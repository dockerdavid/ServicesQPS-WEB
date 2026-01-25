export const showToast = (toast, options) => {
    toast.add({ life: 3000, ...options });
};
