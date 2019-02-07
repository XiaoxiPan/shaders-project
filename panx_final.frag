#version 330 compatibility

in vec3 vNs;
in vec3 vLs;
in vec3 vEs;
in vec2 vST;
in vec3 vMCposition;
in float x;
in float y;
in float z;
in vec4 aVertex;

uniform float uAd;
uniform float uBd;
uniform float uNoiseAmp;
uniform float uNoiseFreq;
uniform float uAlpha;
uniform float uTol;
uniform sampler2D Noise2;
uniform sampler3D Noise3; 

uniform bool uRefraction;
uniform vec4  uWaterColor;
uniform vec4 uRippleColor;


uniform float uMix;
uniform samplerCube uReflectUnit;
uniform samplerCube uRefractUnit;

in vec3 vReflectVector;
in vec3 vRefractVector;

const float TWOPI = 2.*3.14159265;
const vec3 C0 = vec3( 0., -2., 0. );
const float Ka = 0.8;
const float Kd = 0.7;
const float Ks = 0.6;
const float Shininess = 50.;
const float Amp = 2;
const float Freq = 0.1;
const vec4 SpecularColor = vec4(1,1,1,1);

vec3
RotateNormal( float angx, float angy, vec3 n )
{
        float cx = cos( angx );
        float sx = sin( angx );
        float cy = cos( angy );
        float sy = sin( angy );

        // rotate about x:
        float yp =  n.y*cx - n.z*sx;    // y'
        n.z      =  n.y*sx + n.z*cx;    // z'
        n.y      =  yp;
        // n.x      =  n.x;

        // rotate about y:
        float xp =  n.x*cy + n.z*sy;    // x'
        n.z      = -n.x*sy + n.z*cy;    // z'
        n.x      =  xp;
        // n.y      =  n.y;

        return normalize( n );
}


void
main( )
{
	vec3 Normal;
	vec3 Light;
	vec3 Eye;
	vec4 WHITE = vec4( 1.,1.,1.,1. );
	vec4 color;
	float dl;
	vec4 ambient;
	vec4 diffuse;
	float sl = 0.;
	vec3 ref;
	vec4 specular;
		
	
	if (-1.8<x&&x<1.8&&-1.8<y&&y<1.8&&-1.8<z&&z<1.8)
	{
		float s = vST.s;
		float t = vST.t;
		float sp = 2. * s;
		float tp = t;
		int numins = int( floor(sp / uAd ));
		int numint = int( floor(tp / uBd ));
		

		vec2 st = uNoiseFreq * vST;
		vec4 nv  = texture( Noise2, st);
		float sum = nv.r + nv.g +nv.b +nv.a;
		sum = sum - 2;
		float magnitude = uNoiseAmp * sum;
		
		float sc = float(numins)*uAd + uAd/2;
		float tc = float(numint)*uBd + uBd/2;
		float ds = (sp - sc) * 2 / uAd;
		float dt = (tp - tc) * 2 / uBd;
		
		float oldrad = sqrt(ds*ds + dt*dt);
		float newrad = oldrad + magnitude;
		float factor = newrad / oldrad;
		ds *= factor;
		dt *= factor;
		
		float d = ds*ds + dt*dt;
		float tol = smoothstep( 1 - uTol, 1 + uTol, d );

		
		Normal = normalize(vNs);
		Light = normalize(vLs);
		Eye = normalize(vEs);
		
		
		if( d < 1 )
		{
			
			color = uRippleColor;
			
			ambient = Ka * color;

			dl = max( dot(Normal,Light), 0. );
			diffuse = Kd * dl * color;

			if( dot(Normal,Light) > 0. )		
			{
				ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
				sl = pow( max( dot(Eye,ref),0. ), Shininess );
			}
			specular = Ks * sl * color;
			color = vec4( ambient.rgb + diffuse.rgb + specular.rgb, 1. );
			gl_FragColor = mix(color, WHITE, tol);
		}
		
		else
		{
			color = uAlpha * WHITE;
			
			if(uAlpha == 0)
			{
				discard;	
			}
			
			ambient = Ka * color;

			dl = max( dot(Normal,Light), 0. );
			diffuse = Kd * dl * color;

			if( dot(Normal,Light) > 0. )
			{
				ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
				sl = pow( max( dot(Eye,ref),0. ), Shininess );
			}
			specular = Ks * sl * color;
			gl_FragColor = vec4( ambient.rgb + diffuse.rgb + specular.rgb, 1. );
		}

	}
	
	else if(y<=-2.)
	{
		vec4 nvx = texture( Noise3, Freq*aVertex.xyz );
		float angx = nvx.r + nvx.g + nvx.b + nvx.a  -  2.;
		angx *= Amp;
		vec4 nvy = texture( Noise3, Freq*vec3(aVertex.xy,aVertex.z+0.5) );
		float angy = nvy.r + nvy.g + nvy.b + nvy.a  -  2.;
		angy *= Amp;
		vec3 newvNs = RotateNormal( angx, angy, vNs );
		
		Normal = normalize(newvNs);
		Light = normalize(vLs);
		Eye = normalize(vEs);
		ambient = Ka * uWaterColor;
		dl = max( dot(Normal,Light), 0. );
		diffuse = Kd * dl * uWaterColor;
		sl = 0.;
		//if( dot(Normal,Light) > 0. ) 
		{
			vec3 ref = normalize( 2. * Normal * dot(Normal,Light) - Light );
			sl = pow( max( dot(Eye,ref),0. ), Shininess );
		}
		specular = Ks * sl * SpecularColor;
		vec4 vColor = vec4( ambient.rgb + diffuse.rgb + specular.rgb, 1. );
		if(uRefraction)
		{
			vec4 refractcolor = textureCube( uRefractUnit, vRefractVector );
			vec4 reflectcolor = textureCube( uReflectUnit, vReflectVector );
			refractcolor = mix( refractcolor, WHITE, 0.30 );
			gl_FragColor = mix( refractcolor, reflectcolor, uMix );
			gl_FragColor = mix( gl_FragColor, vColor, 0.5 );
		}
		else
		{
			gl_FragColor = vColor;
		}
		
		
		
	}
	else if (z<=-1.8)
	{
		vec4 refractcolor = textureCube( uRefractUnit, vRefractVector );
		gl_FragColor = mix( refractcolor, WHITE, .3 );
	}
	else
	{
		vec4 refractcolor = textureCube( uRefractUnit, vRefractVector );
		vec4 reflectcolor = textureCube( uReflectUnit, vReflectVector );
		refractcolor = mix( refractcolor, WHITE, 0.30 );
		gl_FragColor = vec4(mix( refractcolor, reflectcolor, uMix ).rgb, 1.);
	}
}
