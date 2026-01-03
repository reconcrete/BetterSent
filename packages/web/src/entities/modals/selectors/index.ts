import { useModalsStore } from "../model";

export const useOpenModal = () => {
  return useModalsStore((state) => state.openModal);
};
