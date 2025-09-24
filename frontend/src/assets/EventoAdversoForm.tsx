import { useEffect, useState } from "react";
import { Container, Form, Row, Col, Button, Alert, Navbar, Nav, Card, FloatingLabel } from "react-bootstrap";
import "../App.css";
// =============================
// Formulario COE MEC con Geolocalización (React + TS + React-Bootstrap)
// - Captura GPS con fallback manual
// - Manejo de permisos y errores
// - Botón "Ver en Google Maps" e iframe embebido
// =============================

// Helpers para URLs de Google Maps (no requieren API Key)
const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const embedUrl = (lat: number, lng: number, z = 16) =>
  `https://www.google.com/maps?q=${lat},${lng}&z=${z}&output=embed`;

// Hook local para geolocalización (incluido en el mismo archivo por simplicidad)
function useGeolocation() {
  type Geo = { lat: number; lng: number } | null;
  const [coords, setCoords] = useState<Geo>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = () => {
    if (!("geolocation" in navigator)) {
      setError("Este navegador no soporta geolocalización.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Permiso denegado. Habilitá la ubicación para este sitio.",
          2: "No se pudo determinar la ubicación (sin señal o servicio).",
          3: "Tiempo de espera excedido al obtener la ubicación.",
        };
        setError(messages[err.code] || "Error al obtener la ubicación.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (navigator.permissions?.query) {

      navigator.permissions
        .query({ name: "geolocation" })
        .then((res: PermissionStatus) => {
          if (res.state === "granted" || res.state === "prompt") request();
        })
        .catch(() => request());
    } else {
      request();
    }
  }, []);

  return { coords, loading, error, request };
}

export default function EventoAdversoForm() {
  // Datos del formulario (simple, flexible)
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Geolocalización
  const { coords, loading, error, request } = useGeolocation();
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });

  // Manejo general de cambios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement; // para acceder a checked/files/value
    const { name, value, type, checked, files } = target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files }));
    } else if (type === "number") {
      // Guardar como number si es posible
      const n = value === "" ? "" : Number(value);
      setFormData((prev) => ({ ...prev, [name]: n }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Tomar ubicación de GPS o manual si el usuario activó esa opción
    const chosen = manualMode && manual.lat && manual.lng
      ? { lat: Number(manual.lat), lng: Number(manual.lng) }
      : coords;

    const fullData = { ...formData, ubicacion: chosen };
    console.log("Payload listo para enviar:", fullData);

    // Aquí luego haremos el POST a la API
    // fetch("/api/evento-adverso", { method: "POST", body: JSON.stringify(fullData) ... })
  };

  // Ubicación efectiva a usar para Maps (GPS o manual)
  const effective = manualMode && manual.lat && manual.lng
    ? { lat: Number(manual.lat), lng: Number(manual.lng) }
    : coords ?? null;

  return (
    <div className="app-gray ">
      {/* NAVBAR (sin fixed) */}
      <Navbar bg="dark" variant="dark" expand="md" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-semibold">COE MEC · Relevamiento</Navbar.Brand>
          <Nav className="ms-auto">
            <Button
              size="sm"
              variant="outline-light"
              className="me-2"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Ir arriba
            </Button>
          </Nav>
        </Container>
      </Navbar>

      {/* Wrapper 100vh centrado */}
      <Container fluid className="px-3">
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="w-100" style={{ maxWidth: 980 }}>
            <Form onSubmit={handleSubmit}>
              {/* === CARDS DEL FORMULARIO (contenido original) === */}

              {/* DATOS GENERALES */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge text-bg-primary">1</span>
                    <span className="fw-semibold">Datos generales</span>
                  </div>
                  <div className="small text-muted">
                    Información básica de la institución y del evento.
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <FloatingLabel label="Fecha del evento adverso">
                        <Form.Control
                          type="date"
                          name="fechaEvento"
                          onChange={handleChange}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Nombre de la Institución Educativa">
                        <Form.Control
                          name="nombreInstitucion"
                          onChange={handleChange}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Departamento">
                        <Form.Control
                          name="departamento"
                          onChange={handleChange}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Localidad / Distrito">
                        <Form.Control
                          name="localidad"
                          onChange={handleChange}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Código de la Institución">
                        <Form.Control
                          name="codigoInstitucion"
                          onChange={handleChange}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Nombre del/la Director/a">
                        <Form.Control
                          name="nombreDirector"
                          onChange={handleChange}
                          required
                        />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel label="Contacto del/la Director/a (tel)">
                        <Form.Control
                          type="tel"
                          name="contactoDirector"
                          onChange={handleChange}
                        />
                      </FloatingLabel>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* UBICACIÓN */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">GPS</span>
                    <span className="fw-semibold">Ubicación del siniestro</span>
                  </div>
                  <div className="small text-muted">
                    Capturá la ubicación por GPS o ingresala manualmente.
                  </div>
                </Card.Header>
                <Card.Body>
                  {error && (
                    <Alert variant="warning" className="mb-3">
                      {error}
                      <div className="mt-2 d-flex gap-2 flex-wrap justify-content-center">
                        <Button size="sm" onClick={request} disabled={loading}>
                          {loading ? "Obteniendo..." : "Reintentar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setManualMode((v) => !v)}
                        >
                          {manualMode ? "Usar GPS" : "Ingresar manualmente"}
                        </Button>
                      </div>
                      <div className="mt-2 small text-center">
                        Tip: Permití la ubicación del sitio. En iPhone/Safari se
                        requiere HTTPS si no es localhost.
                      </div>
                    </Alert>
                  )}

                  {!manualMode ? (
                    <FloatingLabel
                      label="Coordenadas detectadas (solo lectura)"
                      className="mb-3"
                    >
                      <Form.Control
                        readOnly
                        value={
                          coords
                            ? `Lat: ${coords.lat}, Lng: ${coords.lng}`
                            : loading
                            ? "Obteniendo ubicación..."
                            : "Ubicación no disponible aún"
                        }
                      />
                    </FloatingLabel>
                  ) : (
                    <Row className="g-3">
                      <Col md={6}>
                        <FloatingLabel label="Latitud (manual)">
                          <Form.Control
                            name="lat_manual"
                            value={manual.lat}
                            onChange={(e) =>
                              setManual((p) => ({ ...p, lat: e.target.value }))
                            }
                            placeholder="-25.29"
                            inputMode="decimal"
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="Longitud (manual)">
                          <Form.Control
                            name="lng_manual"
                            value={manual.lng}
                            onChange={(e) =>
                              setManual((p) => ({ ...p, lng: e.target.value }))
                            }
                            placeholder="-57.63"
                            inputMode="decimal"
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>
                  )}

                  <div className="mt-3 d-flex gap-2 flex-wrap justify-content-center">
                    <Button
                      variant="outline-primary"
                      disabled={!effective}
                      onClick={() => {
                        if (!effective) return;
                        const url = mapsUrl(
                          Number(effective.lat.toFixed(6)),
                          Number(effective.lng.toFixed(6))
                        );
                        window.open(url, "_blank");
                      }}
                    >
                      Ver en Google Maps
                    </Button>
                  </div>

                  {effective && (
                    <div className="mt-3 mx-auto" style={{ borderRadius: 12, overflow: "hidden", maxWidth: 900 }}>
                      <iframe
                        title="Ubicación del siniestro"
                        src={embedUrl(
                          Number(effective.lat.toFixed(6)),
                          Number(effective.lng.toFixed(6))
                        )}
                        width="100%"
                        height="300"
                        loading="lazy"
                        style={{ border: 0 }}
                        allowFullScreen
                      />
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* MATRÍCULA Y TURNO */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">2</span>
                    <span className="fw-semibold">Matrícula y turnos</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <FloatingLabel label="Mañana">
                        <Form.Control type="number" min={0} name="manana" onChange={handleChange} />
                      </FloatingLabel>
                    </Col>
                    <Col md={3}>
                      <FloatingLabel label="Tarde">
                        <Form.Control type="number" min={0} name="tarde" onChange={handleChange} />
                      </FloatingLabel>
                    </Col>
                    <Col md={3}>
                      <FloatingLabel label="Noche">
                        <Form.Control type="number" min={0} name="noche" onChange={handleChange} />
                      </FloatingLabel>
                    </Col>
                    <Col md={3}>
                      <FloatingLabel label="Jornada extendida">
                        <Form.Control type="number" min={0} name="jornadaExtendida" onChange={handleChange} />
                      </FloatingLabel>
                    </Col>
                  </Row>

                  <Form.Group className="mt-3 text-center">
                    <Form.Label className="fw-medium">Turno</Form.Label>
                    <div>
                      {['Inicial','Básica','Media','Permanente','Inclusiva'].map((t) => (
                        <Form.Check inline label={t} name={`turno_${t}`} type="checkbox" onChange={handleChange} key={t} />
                      ))}
                    </div>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* EVENTO ADVERSO */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">3</span>
                    <span className="fw-semibold">Evento adverso</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <FloatingLabel label="Tipo de evento adverso">
                    <Form.Control name="tipoEvento" onChange={handleChange} />
                  </FloatingLabel>
                </Card.Body>
              </Card>
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">3</span>
                    <span className="fw-semibold">¿Espacio alternativo para reubicación?</span>
                  </div>
                </Card.Header>
                <Card.Body>
                 <Form.Group className="mt-3 text-center">
                    <div className="d-inline-block text-start">
                      {['Escuelas/aulas','Centro Comunitario','Locales religiosos','Tinglado','Otras'].map((op) => (
                        <Form.Check label={op} name={`espacio_${op}`} type="checkbox" onChange={handleChange} key={op} />
                      ))}
                    </div>
                  </Form.Group>
                </Card.Body>
              </Card>
               

              {/* NECESIDADES */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">4</span>
                    <span className="fw-semibold">Necesidades / Requerimientos</span>
                  </div>
                </Card.Header>
                <Card.Body className="text-center">
                  <div className="d-inline-block text-start">
                    {['Agua','Saneamiento','Energía eléctrica','Conexión a internet','Conexión telefónica'].map((nec) => (
                      <Form.Check label={nec} name={`necesidad_${nec}`} type="checkbox" onChange={handleChange} key={nec} />
                    ))}
                  </div>
                  <FloatingLabel label="Otras (especifique)" className="mt-3">
                    <Form.Control name="otrasNecesidades" onChange={handleChange} />
                  </FloatingLabel>
                </Card.Body>
              </Card>

              {/* DAÑOS Y ALERTA */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">5</span>
                    <span className="fw-semibold">Daños y tipo de alerta</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <FloatingLabel label="Daños">
                    <Form.Control name="danos" onChange={handleChange} />
                  </FloatingLabel>
                  <Form.Group className="mt-3 text-center">
                    <Form.Label className="fw-medium">Tipo de alerta</Form.Label>
                    <div>
                      {['Amarillo','Naranja','Rojo'].map((alerta) => (
                        <Form.Check label={alerta} name="tipoAlerta" type="radio" value={alerta} onChange={handleChange} key={alerta} />
                      ))}
                    </div>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* SERVICIOS */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">6</span>
                    <span className="fw-semibold">Servicios ofrecidos</span>
                  </div>
                </Card.Header>
                <Card.Body className="text-center">
                  <div className="d-inline-block text-start">
                    {['Merienda Escolar','Almuerzo Escolar','Kit Escolar','Boleto Estudiantil','Apoyo Psicosocial'].map((serv) => (
                      <Form.Check label={serv} name={`servicio_${serv}`} type="checkbox" onChange={handleChange} key={serv} />
                    ))}
                  </div>
                </Card.Body>
              </Card>

              {/* OBSERVACIONES Y ARCHIVOS */}
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-light text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="badge text-bg-primary">7</span>
                    <span className="fw-semibold">Observaciones y archivos</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <FloatingLabel label="Observación">
                    <Form.Control as="textarea" rows={3} name="observacion" onChange={handleChange} />
                  </FloatingLabel>

                  <Row className="g-3 mt-1">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="mt-3">Archivos (máx. 3)</Form.Label>
                        <Form.Control type="file" name="archivos" onChange={handleChange} multiple />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="mt-3">Imágenes</Form.Label>
                        <Form.Control type="file" name="imagenes" onChange={handleChange} multiple accept="image/*" />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* ACCIONES CENTRADAS */}
              <div className="pb-4 d-flex justify-content-center gap-2">
                <Button variant="outline-secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Volver arriba
                </Button>
                <Button type="submit">Enviar</Button>
              </div>
            </Form>
          </div>
        </div>
      </Container>
    </div>
  );
}
