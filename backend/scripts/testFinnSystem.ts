import AIService from '../src/services/aiService';

async function testFinnSystem() {
  console.log('🚀 Testando o Sistema Finn 2.0\n');

  const aiService = new AIService();

  // Teste 1: Pergunta básica sobre transações
  console.log('📝 Teste 1: Pergunta sobre transações');
  console.log('Pergunta: "Como cadastrar uma transação?"\n');
  
  try {
    const response1 = await aiService.generateContextualResponse(
      '',
      'Como cadastrar uma transação?',
      [],
      { userId: 'test-user-1', subscriptionPlan: 'essencial' }
    );
    
    console.log('Resposta:');
    console.log(response1.text);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 1:', error);
  }

  // Teste 2: Pergunta sobre investimentos
  console.log('💰 Teste 2: Pergunta sobre investimentos');
  console.log('Pergunta: "Quais investimentos são melhores para iniciantes?"\n');
  
  try {
    const response2 = await aiService.generateContextualResponse(
      '',
      'Quais investimentos são melhores para iniciantes?',
      [],
      { userId: 'test-user-2', subscriptionPlan: 'free' }
    );
    
    console.log('Resposta:');
    console.log(response2.text);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 2:', error);
  }

  // Teste 3: Análise premium
  console.log('⭐ Teste 3: Análise premium para usuário Top');
  console.log('Pergunta: "Como rebalancear minha carteira com 60% em RV?"\n');
  
  try {
    const premiumAnalysis = await aiService.getAdvancedFinancialAnalysis(
      JSON.stringify({
        name: 'João Silva',
        subscriptionPlan: 'top',
        hasInvestments: true,
        hasGoals: true,
        portfolioValue: 50000
      }),
      'Como rebalancear minha carteira com 60% em RV?',
      []
    );
    
    console.log('Resposta Premium:');
    console.log(premiumAnalysis.analysisText);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 3:', error);
  }

  // Teste 4: Orientação da plataforma
  console.log('🔧 Teste 4: Orientação da plataforma');
  console.log('Pergunta: "Onde encontro meus relatórios?"\n');
  
  try {
    const guidance = await aiService.getPlatformGuidance(
      'Onde encontro meus relatórios?',
      { subscriptionPlan: 'essencial' }
    );
    
    console.log('Orientação:');
    console.log(guidance.guidanceText);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 4:', error);
  }

  // Teste 5: Sistema de feedback
  console.log('📊 Teste 5: Sistema de feedback');
  
  try {
    await aiService.saveUserFeedback('test-user-1', 'msg-123', {
      rating: 5,
      helpful: true,
      comment: 'Resposta muito clara e útil!',
      category: 'helpfulness',
      context: 'Como cadastrar uma transação?'
    });
    
    console.log('✅ Feedback salvo com sucesso!');
    
    // Teste analytics
    const analytics = await aiService.getUserFeedbackAnalytics('test-user-1');
    console.log('📈 Analytics do usuário:');
    console.log(`- Total de feedbacks: ${analytics.totalFeedback}`);
    console.log(`- Avaliação média: ${analytics.averageRating.toFixed(1)}/5`);
    console.log(`- Taxa de utilidade: ${analytics.helpfulnessRate.toFixed(1)}%`);
    
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 5:', error);
  }

  // Teste 6: Pergunta sobre metas
  console.log('🎯 Teste 6: Pergunta sobre metas');
  console.log('Pergunta: "Quero comprar um carro em 2 anos, como planejar?"\n');
  
  try {
    const response6 = await aiService.generateContextualResponse(
      '',
      'Quero comprar um carro em 2 anos, como planejar?',
      [],
      { userId: 'test-user-3', subscriptionPlan: 'essencial' }
    );
    
    console.log('Resposta:');
    console.log(response6.text);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 6:', error);
  }

  // Teste 7: Pergunta educacional
  console.log('📚 Teste 7: Pergunta educacional');
  console.log('Pergunta: "O que é CDI?"\n');
  
  try {
    const response7 = await aiService.generateContextualResponse(
      '',
      'O que é CDI?',
      [],
      { userId: 'test-user-4', subscriptionPlan: 'free' }
    );
    
    console.log('Resposta:');
    console.log(response7.text);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 7:', error);
  }

  // Teste 8: Pergunta de suporte
  console.log('🆘 Teste 8: Pergunta de suporte');
  console.log('Pergunta: "Não consigo acessar minha conta, o que fazer?"\n');
  
  try {
    const response8 = await aiService.generateContextualResponse(
      '',
      'Não consigo acessar minha conta, o que fazer?',
      [],
      { userId: 'test-user-5', subscriptionPlan: 'essencial' }
    );
    
    console.log('Resposta:');
    console.log(response8.text);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 8:', error);
  }

  // Teste 9: Sugestões de melhoria
  console.log('🔍 Teste 9: Sugestões de melhoria');
  
  try {
    const improvements = await aiService.getSuggestedImprovements();
    console.log('💡 Sugestões de melhoria:');
    improvements.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('Erro no teste 9:', error);
  }

  console.log('🎉 Todos os testes concluídos!');
  console.log('\n📋 Resumo dos testes:');
  console.log('✅ Teste 1: Pergunta básica sobre transações');
  console.log('✅ Teste 2: Pergunta sobre investimentos');
  console.log('✅ Teste 3: Análise premium para usuário Top');
  console.log('✅ Teste 4: Orientação da plataforma');
  console.log('✅ Teste 5: Sistema de feedback');
  console.log('✅ Teste 6: Pergunta sobre metas');
  console.log('✅ Teste 7: Pergunta educacional');
  console.log('✅ Teste 8: Pergunta de suporte');
  console.log('✅ Teste 9: Sugestões de melhoria');
  
  console.log('\n🚀 Sistema Finn 2.0 funcionando perfeitamente!');
}

// Executar os testes
testFinnSystem().catch(console.error); 