import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';

export class ThreeVehicleLayer {
  public id = '3d-vehicle-layer';
  public type = 'custom' as const;
  public renderingMode = '3d' as const;

  private map: mapboxgl.Map;
  private scene!: THREE.Scene;
  private camera!: THREE.Camera;
  private renderer!: THREE.WebGLRenderer;
  private vehicleMesh!: THREE.Group;

  private currentCoord: [number, number] = [0, 0];
  private currentBearing: number = 0;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  public onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(0, 100, 50).normalize();
    this.scene.add(directionalLight);

    this.vehicleMesh = this.createCyberVehicle();
    this.scene.add(this.vehicleMesh);
  }

  private createCyberVehicle(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, 
      roughness: 0.3, 
      metalness: 0.7 
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    group.add(body);

    // Neon Glow Strip
    const stripGeo = new THREE.BoxGeometry(2.1, 0.1, 4.6);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.y = 0.4;
    group.add(strip);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
    
    const wheelPositions = [
      [-1.1, 0.4, 1.5], [1.1, 0.4, 1.5],
      [-1.1, 0.4, -1.5], [1.1, 0.4, -1.5]
    ];
    
    wheelPositions.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      group.add(w);
    });

    // Scale up slightly for visibility on map
    group.scale.set(3, 3, 3);
    
    // Rotate so it points "forward" in the correct direction (Mapbox uses Y pointing North, X East)
    // By default, Three.js Box is aligned with axes. We might need to adjust rotation in render.
    return group;
  }

  public updatePosition(coord: [number, number], bearing: number) {
    this.currentCoord = coord;
    this.currentBearing = bearing;
    this.map.triggerRepaint();
  }

  public render(_gl: WebGLRenderingContext, matrix: number[]) {
    if (!this.scene) return;

    // Convert lng/lat to mercator coordinates
    const mercatorCoord = mapboxgl.MercatorCoordinate.fromLngLat(
      this.currentCoord,
      0 // Altitude
    );

    // Create transformation matrix
    const scale = mercatorCoord.meterInMercatorCoordinateUnits();
    
    const m = new THREE.Matrix4().fromArray(matrix);
    const l = new THREE.Matrix4().makeTranslation(mercatorCoord.x, mercatorCoord.y, mercatorCoord.z)
      .scale(new THREE.Vector3(scale, -scale, scale)) // Invert Y axis for Mapbox
      // Apply bearing rotation (convert degrees to radians, rotate around Z axis which is UP in Mapbox coordinates before the camera matrix)
      .multiply(new THREE.Matrix4().makeRotationZ(-this.currentBearing * (Math.PI / 180)));

    this.camera.projectionMatrix = m.multiply(l);
    
    // Reset state for Mapbox
    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}
