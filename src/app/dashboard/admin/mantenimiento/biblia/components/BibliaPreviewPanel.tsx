'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

const DepthContext = React.createContext(0);

interface BibliaPreviewPanelProps {
  rulesContent: string;
  isMobile?: boolean;
}

export function BibliaPreviewPanel({ rulesContent, isMobile = false }: BibliaPreviewPanelProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxHeight: '760px',
        overflowY: 'auto',
      }}
    >
      <h4
        style={{
          margin: 0,
          fontSize: '0.95rem',
          color: '#1e293b',
          fontWeight: 'bold',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '12px',
        }}
      >
        👁️ Vista Previa en Tiempo Real
      </h4>

      <div className="markdown-preview" style={{ color: '#334155' }}>
        {rulesContent ? (
          <DepthContext.Provider value={0}>
            <ReactMarkdown
              components={{
                table: ({ node, ...props }) => (
                  <div style={{ overflowX: 'auto', width: '100%', margin: '16px 0', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th style={{ borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', padding: '10px 14px', background: '#f8fafc', fontWeight: 600, textAlign: 'left', fontSize: '0.85rem' }} {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td style={{ borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', padding: '10px 14px', fontSize: '0.85rem' }} {...props} />
                ),
                h1: ({ node, ...props }) => (
                  <h1
                    style={{
                      fontSize: '1.4rem',
                      color: '#0f172a',
                      borderBottom: '2px solid #f1f5f9',
                      paddingBottom: '6px',
                      marginTop: '20px',
                      marginBottom: '10px',
                      fontWeight: 800,
                    }}
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    style={{
                      fontSize: '1.2rem',
                      color: '#1e293b',
                      borderBottom: '1px solid #f8fafc',
                      paddingBottom: '4px',
                      marginTop: '16px',
                      marginBottom: '8px',
                      fontWeight: 700,
                    }}
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      color: '#334155',
                      marginTop: '14px',
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '10px' }} {...props} />
                ),
                ul: ({ node, ...props }) => {
                  const depth = React.useContext(DepthContext);
                  return (
                    <DepthContext.Provider value={depth + 1}>
                      <ul
                        style={{ paddingLeft: '20px', marginBottom: '10px', listStyleType: 'disc' }}
                        {...props}
                      />
                    </DepthContext.Provider>
                  );
                },
                ol: ({ node, ...props }) => {
                  const depth = React.useContext(DepthContext);
                  return (
                    <DepthContext.Provider value={depth + 1}>
                      <ol
                        style={{
                          listStyleType: depth === 0 ? 'none' : 'decimal',
                          paddingLeft: depth === 0 ? 0 : '20px',
                          margin: 0,
                        }}
                        {...props}
                      />
                    </DepthContext.Provider>
                  );
                },
                li: ({ node, ordered, ...props }: any) => {
                  const depth = React.useContext(DepthContext);
                  const children = React.Children.toArray(props.children);
                  const isTopLevel = depth === 1;
                  const nonSpaceChildren = children.filter((child: any) => {
                    if (typeof child === 'string') return child.trim().length > 0;
                    return child !== null && child !== undefined;
                  });

                  let firstMeaningfulChild: any = nonSpaceChildren[0];
                  let isParagraph = false;

                  if (firstMeaningfulChild && firstMeaningfulChild.type === 'p') {
                    isParagraph = true;
                    const pChildren = React.Children.toArray(firstMeaningfulChild.props.children);
                    const nonSpacePChildren = pChildren.filter((child: any) => {
                      if (typeof child === 'string') return child.trim().length > 0;
                      return child !== null && child !== undefined;
                    });
                    firstMeaningfulChild = nonSpacePChildren[0];
                  }

                  const isStrong =
                    firstMeaningfulChild &&
                    (firstMeaningfulChild.type === 'strong' || firstMeaningfulChild.type === 'b');

                  if (isStrong && isTopLevel) {
                    const title = firstMeaningfulChild;
                    let rest: any[] = [];

                    if (isParagraph) {
                      const pChildren = React.Children.toArray(
                        (nonSpaceChildren[0] as any).props.children
                      );
                      const titleIndex = pChildren.findIndex((child: any) => child === firstMeaningfulChild);
                      if (titleIndex !== -1) {
                        rest.push(...pChildren.slice(titleIndex + 1));
                      }
                      rest.push(...nonSpaceChildren.slice(1));
                    } else {
                      const titleIndex = children.findIndex((child: any) => child === firstMeaningfulChild);
                      if (titleIndex !== -1) {
                        rest.push(...children.slice(titleIndex + 1));
                      }
                    }

                    const hasRestContent = rest.some((child: any) => {
                      if (typeof child === 'string') return child.trim().length > 0;
                      return child !== null && child !== undefined;
                    });

                    if (!hasRestContent) {
                      return (
                        <li
                          style={{
                            fontSize: '0.88rem',
                            marginBottom: '8px',
                            lineHeight: '1.5',
                            listStyleType: 'none',
                          }}
                        >
                          <strong>{title}</strong>
                        </li>
                      );
                    }

                    return (
                      <li
                        className="rule-li"
                        style={{
                          listStyleType: 'none',
                          padding: 0,
                          margin: '0 0 16px 0',
                        }}
                      >
                        <div
                          className="rule-card"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderLeft: '4px solid #10b981',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            color: '#334155',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div
                            onClick={(e) => {
                              const card = e.currentTarget.parentElement!;
                              const content = card.querySelector('.rule-content') as HTMLElement;
                              const arrow = e.currentTarget.querySelector('.rule-arrow') as HTMLElement;
                              if (content.style.display === 'none') {
                                content.style.display = 'block';
                                arrow.style.transform = 'rotate(180deg)';
                                arrow.style.color = '#10b981';
                                card.style.borderColor = '#a7f3d0';
                                card.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.08)';
                              } else {
                                content.style.display = 'none';
                                arrow.style.transform = 'rotate(0deg)';
                                arrow.style.color = '#64748b';
                                card.style.borderColor = '#e2e8f0';
                                card.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                              }
                            }}
                            style={{
                              cursor: 'pointer',
                              padding: isMobile ? '10px 12px' : '14px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              userSelect: 'none',
                            }}
                          >
                            <span style={{ color: '#065f46', fontWeight: 700, fontSize: '0.92rem' }}>
                              {title}
                            </span>
                            <span
                              className="rule-arrow"
                              style={{
                                marginLeft: 'auto',
                                color: '#64748b',
                                transition: 'transform 0.2s ease, color 0.2s ease',
                                fontSize: '0.8rem',
                              }}
                            >
                              ▼
                            </span>
                          </div>
                          <div
                            className="rule-content"
                            style={{
                              display: 'none',
                              padding: isMobile ? '0 12px 12px 12px' : '0 18px 16px 18px',
                              color: '#475569',
                              fontSize: '0.85rem',
                              lineHeight: '1.6',
                            }}
                          >
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                              {rest}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li style={{ fontSize: '0.88rem', marginBottom: '4px', lineHeight: '1.5' }} {...props} />
                  );
                },
              }}
            >
              {rulesContent}
            </ReactMarkdown>
          </DepthContext.Provider>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
            Escribe algo en el editor para verlo renderizado aquí...
          </div>
        )}
      </div>
    </div>
  );
}
