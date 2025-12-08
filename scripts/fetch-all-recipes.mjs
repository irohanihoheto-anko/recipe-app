import * as fs from 'node:fs';

const RAKUTEN_APP_ID = '1012809071798862333';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllRecipes() {
  const categoriesData = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
  
  const allData = {};
  
  // 大カテゴリごとに処理
  for (const largeCategory of categoriesData.result.large) {
    const largeName = largeCategory.categoryName;
    const largeId = largeCategory.categoryId;
    
    console.log(`\n📂 Fetching ${largeName}...`);
    allData[largeName] = {}; // ← オブジェクトに変更
    
    // この大カテゴリに属する中カテゴリを取得
    const mediumCategories = categoriesData.result.medium.filter(
      m => m.parentCategoryId === largeId
    );
    
    // 中カテゴリがない場合
    if (mediumCategories.length === 0) {
      try {
        const url = `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?format=json&applicationId=${RAKUTEN_APP_ID}&categoryId=${largeId}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.result && Array.isArray(data.result)) {
            allData[largeName]['全て'] = data.result;
            console.log(`  ✓ ${largeId}: ${data.result.length} recipes`);
          }
        }
      } catch (error) {
        console.log(`  ✗ ${largeId}: ${error.message}`);
      }
      await sleep(1500);
      continue;
    }
    
    // 中カテゴリごとに取得
    for (const mediumCat of mediumCategories) {
      const mediumName = mediumCat.categoryName;
      const catId = `${largeId}-${mediumCat.categoryId}`;
      
      try {
        const url = `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?format=json&applicationId=${RAKUTEN_APP_ID}&categoryId=${catId}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.result && Array.isArray(data.result)) {
            allData[largeName][mediumName] = data.result;
            console.log(`  ✓ ${mediumName}: ${data.result.length} recipes`);
          }
        } else {
          console.log(`  ✗ ${mediumName}: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ✗ ${mediumName}: ${error.message}`);
      }
      
      await sleep(1500);
    }
    
    const totalInCategory = Object.values(allData[largeName]).reduce((sum, recipes) => sum + recipes.length, 0);
    console.log(`✓ ${largeName}: ${totalInCategory} recipes in ${Object.keys(allData[largeName]).length} subcategories`);
  }
  
  fs.writeFileSync('public/recipes.json', JSON.stringify(allData, null, 2));
  console.log('\n✅ All recipes saved to public/recipes.json');
  
  // 統計
  let totalRecipes = 0;
  let totalSubcategories = 0;
  for (const category of Object.values(allData)) {
    totalSubcategories += Object.keys(category).length;
    for (const recipes of Object.values(category)) {
      totalRecipes += recipes.length;
    }
  }
  console.log(`\n📊 Total: ${totalRecipes} recipes across ${Object.keys(allData).length} categories and ${totalSubcategories} subcategories`);
}

fetchAllRecipes();