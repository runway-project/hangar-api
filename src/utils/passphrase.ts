
import {readFileSync} from 'fs'
import {randomInt} from 'node:crypto'
import word_list_path from 'word-list'

/** A list of random english words, with anything particularly naughty filtered out */
const words = readFileSync(word_list_path, {encoding: 'utf-8'}).split('\n')

/**
 * Generates a passphrase composed of a randomly-chosen number of english words, from
 * a large dataset (about 270,000 entries).
 * 
 * @param word_count Number of words to use
 * @returns A random passphrase
 */
export function generatePassphrase( word_count = 2 ) {

	const chosen_words = []

	for( let i = 0; i < word_count; i++ ) {
		const index = randomInt( words.length - 1 )
		const word = words[index]

		chosen_words.push(word)
	}

	return chosen_words.join('-')
}