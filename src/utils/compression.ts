
import {brotliCompress, brotliDecompress} from 'zlib'

export async function compress( data: string ): Promise<Buffer> {
	return new Promise((resolve, reject) => brotliCompress( data, (err, result) => {
		if( err ) return reject(err)

		return resolve(result)
	} ))
}

export async function decompress( buffer: Buffer ): Promise<string> {
	return new Promise((resolve, reject) => brotliDecompress( buffer, (err, result) => {
		if( err ) return reject(err)

		return resolve(result.toString('utf-8'))
	} ))
}
