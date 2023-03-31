import React from "react";

function Box(props) {
	return (
	  <mesh {...props} recieveShadow={true} castShadow>
		<boxBufferGeometry args={[2, 2, 2]} {...props}  />
		<meshPhysicalMaterial color={"hotpink"} />
	  </mesh>
	);
  }

export default Box;