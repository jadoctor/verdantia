interface GestorProps {
  aviso: any;
  pautas: any[];
  userEmail: string;
  onClose: () => void;
  onRefresh: () => void;
  setLightboxUrl: (url: string | null) => void;
}

function GestorFotosLaborModal({ aviso, pautas, userEmail, onClose, onRefresh, setLightboxUrl }