
interface GestorProps {
  aviso: any;
  pautas: any[];
  userEmail: string;
  onClose: () => void;
  onRefresh: () => void;
  setLightboxUrl: (url: string | null) => void;
}

function GestorFotosLaborModal({ aviso, pautas, userEmail, onClose, onRefresh, setLightboxUrl }: GestorProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [consentimiento, setConsentimiento] = useState<number | null | undefined>(undefined);
  const [mostrarModalConsentimiento, setMostrarModalConsentimiento] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pautaRef = pautas.find(p => p.idlaborespauta === aviso.idpauta);
  const laborName = pautaRef ? pautaRef.laboresnombre : 'Labor';

  useEffect(() => {
    loadPhotos();
    checkConsentimiento();
  }, [aviso.id, aviso.isPending, aviso.idpauta, aviso.fechaEmision]);

  const checkConsentimiento = async () => {
    try {
      const res = await fetch('/api/user/consentimiento-foto', { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setConsentimiento(data.consentimiento); // null | 0 | 1
    } catch (e) {
      console.error('Error checking consentimiento:', e);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const url = aviso.isPending 
        ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${aviso.idcultivos}&idpauta=${aviso.idpauta}&fechaEmision=${encodeURIComponent(aviso.fechaEmision)}`
        : `/api/user/cultivos/avisos/${aviso.id}/photos`;
      const res = await fetch(url, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (e) {
      console.error('Error loading photos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhotoClick = () => {
    if (photos.length >= 4) {
      alert('Límite alcanzado: solo puedes subir hasta 4 fotos por aviso.');
      return;
    }

    if (consentimiento === 1) {
      fileInputRef.curren
<truncated 4446 bytes>