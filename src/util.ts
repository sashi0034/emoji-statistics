

export function makeZeroPadding(num: number, length: number){
	return ( Array(length).join('0') + num ).slice( -length );
}

