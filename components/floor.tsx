import React from "react";

function Floor(props) {
  return (
    <mesh {...props} recieveShadow>
      <boxBufferGeometry args={[20,1,20]} />
      <meshPhysicalMaterial color='white' />
    </mesh>
  );
}

export default Floor;