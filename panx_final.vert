#version 330 compatibility


uniform float uLightX, uLightY, uLightZ;
vec3 eyeLightPosition = vec3( uLightX, uLightY, uLightZ );

out vec3 vRefractVector;
out vec3 vReflectVector;
uniform float uEta;
uniform float uR1, uR2;
const float ETA_RATIO = 0.66;

out vec3 vNs;
out vec3 vLs;
out vec3 vEs;
out vec2 vST;
out vec3 vMCposition;
out float x;
out float y;
out float z;
out vec4 aVertex;

const float TWOPI = 2.*3.14159265;
const float A =  1.5;
const float B = 0.1;
const float C = 8.5;
const float D = 0.1; 

void
main( )
{
	x = gl_Vertex.x;
	y = gl_Vertex.y;
	z = gl_Vertex.z;
	vec3 ECposition = vec3( gl_ModelViewMatrix * gl_Vertex );
	if (-1.8<x&&x<1.8&&-1.8<y&&y<1.8&&-1.8<z&&z<1.8)
	{
		vNs = normalize( gl_NormalMatrix * gl_Normal );

		vLs = eyeLightPosition - ECposition.xyz;		
		
		vEs = vec3( 0., 0., 0. ) - ECposition.xyz;		


		vST = gl_MultiTexCoord0.st;
		
		gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	}
	else if (y<=-2.)
	{
		float r = x*x + z*z; 
		float y = A * cos(TWOPI*B*r+C) * exp(-D*r) - 8;
		aVertex = vec4(x,y,z,1.);
		
		vec4 ECpositionWater = gl_ModelViewMatrix * aVertex;
		
		float drdx = 2.*x; 
		float dydx = -A*sin(TWOPI*B*r+C) * TWOPI*B*drdx * exp(-D*r) + A*cos(TWOPI*B*r+C) * exp(-D*r) * (-D)*drdx; 

		float drdz = 2.*z; 
		float dydz = -A*sin(TWOPI*B*r+C) * TWOPI*B*drdz * exp(-D*r) + A*cos(TWOPI*B*r+C) * exp(-D*r) * (-D)*drdz;

		vec3 Tx = vec3(1., dydx, 0 ); 
		vec3 Tz = vec3(0., dydz, 1 );
		vNs = normalize( cross( Tx, Tz ) );
		vNs = normalize( gl_NormalMatrix * vNs ); 
		vLs = eyeLightPosition - ECpositionWater.xyz;
		vEs = vec3( 0., 0., 0. ) - ECpositionWater.xyz;
		vec3 eyeDir = normalize( ECpositionWater.xyz );
    	vec3 normal = normalize( gl_NormalMatrix * gl_Normal );
		vRefractVector = refract( eyeDir, normal, uEta );
		vReflectVector = reflect( eyeDir, normal );
		
		gl_Position = gl_ModelViewProjectionMatrix * aVertex;
	}
	else if(z<=-1.8)
	{
		vec3 P   = vec3( gl_ModelViewMatrix * gl_Vertex );
		vec3 Eye = vec3( 0., 0., 0. );

		vec3 FromEyeToPt = normalize( P - Eye  );			// vector from eye to pt

		vec3 Center1 = vec3( 0., 0., P.z - uR1 );
		vec3 Normal1;

		if( uR1 >= 0. )
			Normal1 = normalize( P - Center1 );
		else
			Normal1 = normalize( Center1 - P );

		vec3 v1 = refract( FromEyeToPt, Normal1, ETA_RATIO );   // eta ratio = in/out
		v1 = normalize( v1 );

		vec3 Center2 = vec3( 0., 0., P.z + uR2 );
		vec3 Normal2;

		if( uR2 >= 0. )
			Normal2 = normalize( Center2 - P );
		else
			Normal2 = normalize( P - Center2 );

		vec3 v2 = refract( v1, Normal2, 1./ETA_RATIO );

		vRefractVector = v2;

		gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	}
	else
	{
		//vec3 ECposition = vec3( gl_ModelViewMatrix * gl_Vertex );
		vec3 eyeDir = normalize( ECposition )- vec3(0.,0.,0.);
    	vec3 normal = normalize( gl_NormalMatrix * gl_Normal );
		vRefractVector = refract( eyeDir, normal, uEta );
		vReflectVector = reflect( eyeDir, normal );

		
		gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
	}
	
}