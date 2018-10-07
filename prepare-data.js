import fs from 'fs';
import path from 'path';

import yargs from 'yargs';
import parse from 'csv-parse';

const argv = yargs
  .usage( '$0 [args]' )
  .command(
    '$0',
    'prepare-data',
    () => {},
    ( argv ) => {
      console.log( 'Go!', argv );

      const parser = parse({ columns: true });
      const source = fs.createReadStream( path.resolve( process.cwd(), './resources/data/NeoStrataCatalog.csv' ) );
      const output = fs.createWriteStream( path.resolve( process.cwd(), './resources/data/catalog.json' ) );

      const catalog = [];

      source
        .pipe( parser )
        .on( 'data', record => {
          if ( record.ProductCode && record['match-tool-status'] ) {
            const descriptionParts = record['match-tool-description'].replace( /\n/g, ' ' ).match( /previously liked the (.+) benefits[:\w\s]*TRY OUR (.+)$/ ) || [];

            catalog.push({
              code: record.ProductCode,
              name: record.ProductName,
              skin_care_system: record['skin-care-system'],
              product_type: record['product-type'],
              benefits: descriptionParts[1] || '',
              header: record['match-tool-header'],
              try_our: descriptionParts[2] || '',
              description: record.ContentFullProductDescription,
              ingredients: [
                record['ingredient-highlights']
              ],
              images: {
                front: `/resources/images/match-tool/${ record.ProductCode }.png`,
                hero: '/cms/files/MISSING.png'
              },
              status: record['match-tool-status'],
              before: {
                name: record['match-tool-old-product-name'],
                image: `/resources/images/match-tool/${ record.ProductCode }-before.png`
              }
            });
          }
        })
        .on( 'end', () => {
          output.write( JSON.stringify( catalog, null, 2 ) );
          output.end();

          console.log( 'Done!' );
        });
    }
  )
  .help()
  .strict()
  .argv;

// catalog.push( Object.keys( transforms ).reduce( ( acc, key ) => ({
//   ...acc,
//   [key]: typeof transforms[key] === 'function' ? transforms[key]( record ) : transforms[key]
// }), {}));
