import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';

export class ThreeVehicleLayer {
  public id = '3d-vehicle-layer';
  public type = 'custom' as const;
  public renderingMode = '3d' as const;
  public slot = 'top';

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Boosted
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // Boosted
    directionalLight.position.set(0, 100, 50).normalize();
    this.scene.add(directionalLight);

    this.vehicleMesh = this.createNavigationArrow();
    this.scene.add(this.vehicleMesh);
  }

  private createNavigationArrow(): THREE.Group {
    const group = new THREE.Group();

    const arrowGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Top Wing Left
      0, 0, 1.8,    
      -0.8, 0, -1.2, 
      0, 0, -0.6,  
      
      // Top Wing Right
      0, 0, 1.8,    
      0, 0, -0.6,  
      0.8, 0, -1.2, 
    ]);

    arrowGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    arrowGeometry.computeVertexNormals();

    const arrowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00f2ff, 
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00a2ff,
      emissiveIntensity: 1.5,
      side: THREE.DoubleSide
    });

    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    group.add(arrow);

    // Add a glowing core under the arrow
    const glowGeometry = new THREE.CircleGeometry(0.8, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = Math.PI / 2;
    glow.position.z = -0.2;
    group.add(glow);

    // Scale up for visibility
    group.scale.set(4, 4, 4);
    
    return group;
  }

  public updatePosition(coord: [number, number], bearing: number) {
    this.currentCoord = coord;
    this.currentBearing = bearing;
    // Keep vehicle mesh upright (Y-up) and rotate to heading direction
    const bearingRad = THREE.MathUtils.degToRad(this.currentBearing);
    // Mapbox bearing is clockwise, Three.js is counter-clockwise
    this.vehicleMesh.rotation.set(Math.PI / 2, 0, -bearingRad);
    this.map.triggerRepaint();
  }

  public render(_gl: WebGLRenderingContext, matrix: number[]) {
    if (!this.scene) return;

    // Convert lng/lat to mercator coordinates
    const mercatorCoord = mapboxgl.MercatorCoordinate.fromLngLat(
      this.currentCoord,
      0 // Altitude
    );

    // Create transformation matrix for vehicle rendering
    const scale = mercatorCoord.meterInMercatorCoordinateUnits();
    const bearingRad = THREE.MathUtils.degToRad(this.currentBearing);
    
    // Rotation around Z axis (up) to align vehicle forward direction with heading
    // Rotation around Z axis (up) to align vehicle forward direction with heading
    const rotationZ = new THREE.Matrix4().makeRotationZ(-bearingRad);
    
    // Translation to map position
    const translation = new THREE.Matrix4().makeTranslation(mercatorCoord.x, mercatorCoord.y, mercatorCoord.z);
    
    // Uniform scaling (no Y inversion) to keep vehicle upright
    const scaleM = new THREE.Matrix4().makeScale(scale, scale, scale);
    
    // Combine: translate -> rotate -> scale
    const modelMatrix = translation.multiply(rotationZ).multiply(scaleM);
    
    const m = new THREE.Matrix4().fromArray(matrix);
    this.camera.projectionMatrix = m.multiply(modelMatrix);
    
    // Reset state for Mapbox
    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}
