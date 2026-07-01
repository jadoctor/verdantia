import React from 'react';
import PremiumAddButton from '@/components/ui/PremiumAddButton';
import PremiumAiButton from '@/components/ui/PremiumAiButton';
import PremiumAutoEnhanceButton from '@/components/ui/PremiumAutoEnhanceButton';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumCancelButton from '@/components/ui/PremiumCancelButton';
import PremiumDeleteButton from '@/components/ui/PremiumDeleteButton';
import PremiumEditButton from '@/components/ui/PremiumEditButton';
import PremiumExitButton from '@/components/ui/PremiumExitButton';
import PremiumSaveButton from '@/components/ui/PremiumSaveButton';
import PremiumUndoButton from '@/components/ui/PremiumUndoButton';
import PremiumVisibilityToggle from '@/components/ui/PremiumVisibilityToggle';
import PremiumCheckButton from '@/components/ui/PremiumCheckButton';
import PremiumReanalyzeButton from '@/components/ui/PremiumReanalyzeButton';
import PremiumConfirmButton from '@/components/ui/PremiumConfirmButton';
import PremiumUploadButton from '@/components/ui/PremiumUploadButton';
import PremiumNextButton from '@/components/ui/PremiumNextButton';
import PremiumWarningButton from '@/components/ui/PremiumWarningButton';
import PremiumSyncButton from '@/components/ui/PremiumSyncButton';
import PremiumExportButton from '@/components/ui/PremiumExportButton';
import PremiumFilterButton from '@/components/ui/PremiumFilterButton';

interface ActionButtonsShowcaseProps {
  handleClick: (name: string) => void;
  cardStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  containerStyle: React.CSSProperties;
}

export default function ActionButtonsShowcase({ handleClick, cardStyle, titleStyle, containerStyle }: ActionButtonsShowcaseProps) {
  const iconStyle = { fontSize: '28px', marginBottom: '4px', textAlign: 'center' as const };

  return (
    <>
      <div style={{ marginTop: '32px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>👆 Botones de Acción</h2>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, #e2e8f0, transparent)' }}></div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
        gap: '20px'
      }}>
        {/* Card elements for Action Buttons */}
        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumAddButton</h3>
          <div style={iconStyle}>➕</div>
          <div style={containerStyle}>
            <PremiumAddButton onClick={() => handleClick('Add')} text="Nuevo" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumEditButton</h3>
          <div style={iconStyle}>✏️</div>
          <div style={containerStyle}>
            <PremiumEditButton onClick={() => handleClick('Edit')} text="Editar" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumSaveButton</h3>
          <div style={iconStyle}>💾</div>
          <div style={containerStyle}>
            <PremiumSaveButton onClick={() => handleClick('Save')} text="Guardar Cambios" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumExitButton</h3>
          <div style={iconStyle}>🚪</div>
          <div style={containerStyle}>
            <PremiumExitButton onClick={() => handleClick('Exit')} text="Salir" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumBackButton</h3>
          <div style={iconStyle}>🏠</div>
          <div style={containerStyle}>
            <PremiumBackButton onClick={() => handleClick('Back')} text="Volver al Inicio" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumCancelButton</h3>
          <div style={iconStyle}>❌</div>
          <div style={containerStyle}>
            <PremiumCancelButton onClick={() => handleClick('Cancel')} text="Cancelar" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumDeleteButton</h3>
          <div style={iconStyle}>🗑️</div>
          <div style={containerStyle}>
            <PremiumDeleteButton onClick={() => handleClick('Delete')} text="Eliminar Registro" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumVisibilityToggle</h3>
          <div style={iconStyle}>👁️</div>
          <div style={containerStyle}>
            <PremiumVisibilityToggle checked={true} onChange={() => handleClick('Toggle')} label="Visibilidad" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumReanalyzeButton</h3>
          <div style={iconStyle}>🔄</div>
          <div style={containerStyle}>
            <PremiumReanalyzeButton onClick={(e: any) => handleClick('Reanalyze')} />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumAiButton</h3>
          <div style={iconStyle}>🤖</div>
          <div style={containerStyle}>
            <PremiumAiButton onClick={() => handleClick('AI')} text="Asistente IA" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumAutoEnhanceButton</h3>
          <div style={iconStyle}>✨</div>
          <div style={containerStyle}>
            <PremiumAutoEnhanceButton onClick={() => handleClick('Enhance')} text="Auto Ajuste" />
          </div>
        </div>
        
        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumUndoButton</h3>
          <div style={iconStyle}>↺</div>
          <div style={containerStyle}>
            <PremiumUndoButton onClick={() => handleClick('Undo')} text="Deshacer" />
          </div>
        </div>
        
        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumCheckButton</h3>
          <div style={iconStyle}>✅</div>
          <div style={containerStyle}>
            <PremiumCheckButton onClick={() => handleClick('Check')} text="Chekeo" />
          </div>
        </div>
        
        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumConfirmButton</h3>
          <div style={iconStyle}>✓</div>
          <div style={containerStyle}>
            <PremiumConfirmButton onClick={() => handleClick('Confirm')} text="Confirmar" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumUploadButton</h3>
          <div style={iconStyle}>⬆️</div>
          <div style={containerStyle}>
            <PremiumUploadButton onClick={() => handleClick('Upload')} text="Subir" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumNextButton</h3>
          <div style={iconStyle}>➡️</div>
          <div style={containerStyle}>
            <PremiumNextButton onClick={() => handleClick('Next')} text="Siguiente" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumWarningButton</h3>
          <div style={iconStyle}>⚠️</div>
          <div style={containerStyle}>
            <PremiumWarningButton onClick={() => handleClick('Warning')} text="Advertencia" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumSyncButton</h3>
          <div style={iconStyle}>🔄</div>
          <div style={containerStyle}>
            <PremiumSyncButton onClick={() => handleClick('Sync')} text="Sincronizar" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumExportButton</h3>
          <div style={iconStyle}>📥</div>
          <div style={containerStyle}>
            <PremiumExportButton onClick={() => handleClick('Export')} text="Exportar" />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumFilterButton</h3>
          <div style={iconStyle}>🎯</div>
          <div style={containerStyle}>
            <PremiumFilterButton onClick={() => handleClick('Filter')} text="Filtros" activeCount={2} />
          </div>
        </div>
      </div>
    </>
  );
}
