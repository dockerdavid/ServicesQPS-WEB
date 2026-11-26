<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Button, Dialog, Message, Password } from 'primevue';
import { useToast } from 'primevue/usetoast';

import { AuthServices } from '../auth.services';
import { useAuthStore } from '../../../store/auth.store';
import { useUserStore } from '../../../store/user.store';
import { usePasswordGateStore } from '../../../store/password-gate.store';
import { getApiErrorMessage } from '../../../utils/api-error-message';
import router from '../../../router';

/**
 * Dialogo bloqueante "Crea tu nueva clave". Montado en App.vue: aparece sobre
 * cualquier pantalla cuando el admin pidió el cambio (login, GET /auth/me al
 * abrir o volver a la pestaña, o un 403 PASSWORD_CHANGE_REQUIRED del API).
 */
const MIN_LENGTH = 4;

const toast = useToast();
const authStore = useAuthStore();
const gate = usePasswordGateStore();

const visible = computed(() => Boolean(authStore.token) && gate.required);

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const errors = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const submitError = ref('');
const saving = ref(false);
let checking = false;

const check = async () => {
    if (!authStore.token || checking) return;
    checking = true;
    try {
        const me = await AuthServices.getMe();
        if (me?.mustChangePassword) gate.require();
        else if (!gate.hasPendingCallback()) gate.reset();
    } catch {
        // Sin red o API viejo: no bloquear (si fue 403 el interceptor ya marcó el gate).
    } finally {
        checking = false;
    }
};

const onVisibility = () => {
    if (document.visibilityState === 'visible') check();
};

onMounted(() => {
    check();
    document.addEventListener('visibilitychange', onVisibility);
});
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibility));

watch(() => authStore.token, (token) => {
    if (token) check();
    else gate.reset();
});

watch(visible, (isVisible) => {
    if (!isVisible) return;
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    errors.currentPassword = '';
    errors.newPassword = '';
    errors.confirmPassword = '';
    submitError.value = '';
});

const validate = (): boolean => {
    errors.currentPassword = form.currentPassword ? '' : 'Ingresa tu clave actual.';
    errors.newPassword = '';
    errors.confirmPassword = '';
    if (!form.newPassword) errors.newPassword = 'Ingresa la clave nueva.';
    else if (form.newPassword.length < MIN_LENGTH) errors.newPassword = `Mínimo ${MIN_LENGTH} caracteres.`;
    else if (form.newPassword === form.currentPassword) errors.newPassword = 'La clave nueva debe ser distinta a la actual.';
    else if (form.confirmPassword !== form.newPassword) errors.confirmPassword = 'Las claves no coinciden.';
    return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword;
};

const submit = async () => {
    if (saving.value) return;
    submitError.value = '';
    if (!validate()) return;
    saving.value = true;
    try {
        await AuthServices.changePassword(form.currentPassword, form.newPassword);
        toast.add({ severity: 'success', summary: 'Clave actualizada', detail: 'Usa tu nueva clave la próxima vez que inicies sesión.', life: 4000 });
        const hadCallback = gate.hasPendingCallback();
        gate.resolve();
        // Sesión ya abierta: las pantallas pidieron datos y recibieron 403; recargar.
        if (!hadCallback) window.location.reload();
    } catch (error) {
        submitError.value = getApiErrorMessage(error, 'No se pudo cambiar la clave. Inténtalo de nuevo.');
    } finally {
        saving.value = false;
    }
};

const signOut = () => {
    gate.reset();
    authStore.removeToken();
    useUserStore().removeUserData();
    router.push('/auth');
};
</script>

<template>
    <Dialog
        :visible="visible"
        modal
        :closable="false"
        :close-on-escape="false"
        :draggable="false"
        header="Crea tu nueva clave"
        class="w-[95vw] sm:w-[26rem]"
    >
        <form class="flex flex-col gap-4" @submit.prevent="submit">
            <p class="text-sm text-gray-600 m-0">
                Por seguridad debes cambiar tu clave antes de continuar.
            </p>

            <div class="flex flex-col gap-1">
                <label class="text-sm font-semibold" for="fpc-current">Clave actual</label>
                <Password v-model="form.currentPassword" input-id="fpc-current" :feedback="false" toggle-mask fluid
                    autocomplete="current-password" />
                <Message v-if="errors.currentPassword" severity="error" size="small" variant="simple">{{ errors.currentPassword }}</Message>
            </div>

            <div class="flex flex-col gap-1">
                <label class="text-sm font-semibold" for="fpc-new">Clave nueva</label>
                <Password v-model="form.newPassword" input-id="fpc-new" :feedback="false" toggle-mask fluid
                    autocomplete="new-password" />
                <Message v-if="errors.newPassword" severity="error" size="small" variant="simple">{{ errors.newPassword }}</Message>
            </div>

            <div class="flex flex-col gap-1">
                <label class="text-sm font-semibold" for="fpc-confirm">Confirmar clave nueva</label>
                <Password v-model="form.confirmPassword" input-id="fpc-confirm" :feedback="false" toggle-mask fluid
                    autocomplete="new-password" />
                <Message v-if="errors.confirmPassword" severity="error" size="small" variant="simple">{{ errors.confirmPassword }}</Message>
            </div>

            <small class="text-gray-500">Mínimo {{ MIN_LENGTH }} caracteres.</small>

            <Message v-if="submitError" severity="error">{{ submitError }}</Message>

            <div class="flex items-center justify-between gap-2">
                <Button type="button" label="Cerrar sesión" severity="secondary" text @click="signOut" :disabled="saving" />
                <Button type="submit" label="Guardar clave" :loading="saving" />
            </div>
        </form>
    </Dialog>
</template>
