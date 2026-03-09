#!/usr/bin/env node

/**
 * Research Agent Test
 * Tests the research agent with YouTube-only data (Twitter optional)
 */

import dotenv from "dotenv";
import { researchGovernmentQuery } from "./api.js";

// Load environment variables
dotenv.config();

async function testResearchAgent() {
  console.log("🔬 Testing Research Agent...\n");

  const testQueries = [
    "How do I get 10th marks card if I lost it?",
    "How to apply for Aadhaar card",
    "PAN card correction process",
  ];

  for (const query of testQueries) {
    try {
      console.log(`\n📝 Query: "${query}"`);
      console.log("-".repeat(60));

      const result = await researchGovernmentQuery(query);

      console.log(`\n✅ Government Service: ${result.governmentService?.name || "Not matched"}`);
      
      if (result.governmentService) {
        console.log(`   Processing Time: ${result.governmentService.processingTime}`);
        console.log(`   Official Links: ${result.governmentService.officialLinks.length} found`);
      }

      console.log(`\n📊 Opinion Distribution:`);
      console.log(`   Opinion: ${result.opinionDistribution.opinion}%`);
      console.log(`   Information: ${result.opinionDistribution.information}%`);
      console.log(`   Other: ${result.opinionDistribution.other}%`);

      console.log(`\n🎯 Credibility Score: ${result.averageCredibility}/100`);

      console.log(`\n📌 Top Key Points:`);
      result.topKeyPoints.slice(0, 3).forEach((kp, i) => {
        console.log(`   ${i + 1}. ${kp.text.substring(0, 70)}...`);
        console.log(`      Mentioned ${kp.frequency}x · Sentiment: ${kp.sentiment}`);
      });

      console.log(`\n🔗 Top Resources: ${result.resources.length} found`);
      result.resources.slice(0, 3).forEach((resource, i) => {
        console.log(`   ${i + 1}. ${resource.title.substring(0, 60)}...`);
        console.log(`      Type: ${resource.type} · Credibility: ${resource.credibility.overall}/100`);
      });

      console.log("\n" + "=".repeat(60));
    } catch (error) {
      console.error(`❌ Error:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log("\n✨ Research Agent Test Complete!\n");
}

testResearchAgent();
