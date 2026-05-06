import * as THREE from 'three';

export class ThreeObjectFactory {
  public static createTrafficLight(): THREE.Group {
    const group = new THREE.Group();

    // Pole
    const poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 15);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    group.add(pole);

    // Box
    const boxGeom = new THREE.BoxGeometry(2, 6, 2);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const box = new THREE.Mesh(boxGeom, boxMat);
    box.position.y = 8;
    group.add(box);

    // Lights
    const createLight = (color: number, y: number) => {
      const geom = new THREE.CircleGeometry(0.8, 32);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
      const light = new THREE.Mesh(geom, mat);
      light.position.set(0, y, 1.05);
      return light;
    };

    group.add(createLight(0xff0000, 10)); // Red
    group.add(createLight(0xffaa00, 8));  // Amber
    group.add(createLight(0x00ff00, 6));  // Green

    return group;
  }

  public static createRoadBlock(): THREE.Group {
    const group = new THREE.Group();

    // Barrier
    const barrierGeom = new THREE.BoxGeometry(10, 2, 0.5);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x0033cc }); // Police Blue
    const barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.y = 2;
    group.add(barrier);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.5, 4, 0.5);
    const legL = new THREE.Mesh(legGeom, barrierMat);
    legL.position.set(-4, 0, 0);
    const legR = new THREE.Mesh(legGeom, barrierMat);
    legR.position.set(4, 0, 0);
    group.add(legL, legR);

    // Siren
    const sirenGeom = new THREE.CylinderGeometry(0.5, 0.5, 1);
    const sirenMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const siren = new THREE.Mesh(sirenGeom, sirenMat);
    siren.position.set(0, 3, 0);
    group.add(siren);

    return group;
  }

  public static createAccident(): THREE.Group {
    const group = new THREE.Group();

    // Wreckage (Abstract)
    const bodyGeom = new THREE.BoxGeometry(4, 2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.rotation.z = Math.PI / 4; // Flipped
    group.add(body);

    // Smoke (Particles/Abstract)
    for (let i = 0; i < 5; i++) {
      const smokeGeom = new THREE.SphereGeometry(1 + Math.random(), 8, 8);
      const smokeMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.4 });
      const smoke = new THREE.Mesh(smokeGeom, smokeMat);
      smoke.position.set(Math.random() - 0.5, 2 + i, Math.random() - 0.5);
      group.add(smoke);
    }

    return group;
  }
}
