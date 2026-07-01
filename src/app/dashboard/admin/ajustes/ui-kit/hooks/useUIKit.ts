import { useState, useCallback } from 'react';

const DUMMY_PHOTOS = [
  { 
    id: 268, 
    ruta: '/uploads/especies/tomate-rojo-fresco-con-gotas-de-rocio-en-la-planta-hojas-verdes-y-fondo-borroso-1778428835887.webp',
    resumen: '{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo fresco con gotas de rocío en la planta, hojas verdes y fondo borroso.","dominant_color":"rgb(24, 56, 24)","vibrant_color":"#e65d0b","blurhash":"LJC~L%X+1Ji{cCWBnPV[1Js.}ER,","exif_data":{}}'
  },
  { 
    id: 275, 
    ruta: '/uploads/especies/tomate-rojo-fresco-con-gotas-de-agua-en-tabla-de-cortar-y-cuchillo-1778579488745.webp',
    resumen: '{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo fresco con gotas de agua en tabla de cortar y cuchillo.","dominant_color":"rgb(232, 216, 200)","vibrant_color":"#cd3818","blurhash":"LJIE5}R5_M-:GFtRxboz00%gVZRj","exif_data":{}}'
  },
  { 
    id: 276, 
    ruta: '/uploads/especies/tomate-rojo-maduro-con-rocio-en-la-planta-hojas-verdes-y-flores-amarillas-1778580770929.webp',
    resumen: '{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate rojo maduro con rocío en la planta, hojas verdes y flores amarillas.","dominant_color":"rgb(8, 24, 8)","vibrant_color":"#dd2b09","blurhash":"LIC$S[Tc2@-ob[tPi|W=0#v~{zI;","exif_data":{}}'
  },
  { 
    id: 281, 
    ruta: '/uploads/variedades/tomate-cherry-rojo-con-gotas-de-agua-sobre-tabla-de-madera-fondo-verde-1778581304106.webp',
    resumen: '{"profile_object_x":50,"profile_object_y":50,"profile_object_zoom":100,"profile_brightness":100,"profile_contrast":100,"profile_style":"","seo_alt":"Tomate cherry rojo con gotas de agua sobre tabla de madera, fondo verde.","dominant_color":"rgb(40, 56, 8)","vibrant_color":"#cd3f25","blurhash":"LGE.p~WFBOof.hIa#pNIyUN2=xM|","exif_data":{}}'
  },
];

export function useUIKit() {
  const [activePhoto, setActivePhoto] = useState<string | number>(268);
  const [photos, setPhotos] = useState(DUMMY_PHOTOS);
  const [activeSegment, setActiveSegment] = useState('todos');
  const [activeDropdown, setActiveDropdown] = useState('opcion1');

  const handleClick = useCallback((name: string) => {
    console.log(`Clicked ${name}`);
  }, []);

  const handleReorder = useCallback((dragId: string | number, dropId: string | number) => {
    const dragIdx = photos.findIndex(p => p.id === dragId);
    const dropIdx = photos.findIndex(p => p.id === dropId);
    if (dragIdx < 0 || dropIdx < 0) return;
    
    setPhotos(prevPhotos => {
      const newArr = [...prevPhotos];
      const [moved] = newArr.splice(dragIdx, 1);
      newArr.splice(dropIdx, 0, moved);
      return newArr;
    });
  }, [photos]);

  return {
    activePhoto,
    setActivePhoto,
    photos,
    activeSegment,
    setActiveSegment,
    activeDropdown,
    setActiveDropdown,
    handleClick,
    handleReorder
  };
}
