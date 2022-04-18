const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('search sku on nike')
    .addStringOption(option => option.setName('sku').setDescription('sku').setRequired(true)),

  async execute(interaction) {
    await axios({
      method: 'get',
      url: `https://api.nike.com/product_feed/threads/v2?filter=language(en)&filter=marketplace(US)&filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)&filter=productInfo.merchProduct.styleColor(${interaction.options.getString('sku').toUpperCase()})`,
    })
    .then( async response => {

      const embed = new MessageEmbed()

      if( response.data.objects.length === 0 ) {
        embed.setDescription(`${interaction.options.getString('sku').toUpperCase()} not loaded on nike`)
        await interaction.reply({embeds: [embed]})
        return;
      }
      const data = response.data.objects[0].productInfo[0]
      const status = data.merchProduct.status
      const sku = data.merchProduct.styleColor
      const retail = data.merchPrice.currentPrice.toString()
      const title = data.productContent.title
      const image = data.imageUrls.productImageUrl
      const productId = data.merchProduct.id
      
      embed
        .setColor('#FFFFFF')
        .setTitle(title)
        .setURL(`https://www.nike.com/us/t/-/${sku}`)
        .setThumbnail(image)
        .addFields(
          { name: 'Status', value: status, inline: true},
          { name: 'SKU', value: sku, inline: true },
          { name: 'Price', value: retail, inline: true },
        )

      const embedFormat = [];
      data.skus.forEach( (value, i) => {
        if( data.availableSkus[i].level !== 'OOS' ) {
          embedFormat.push(`${data.skus[i].nikeSize} - ${data.availableSkus[i].level}\n`)
        }
      })
      if ( !embedFormat.length ) {
        embed.addField('Stock Levels', 'All sizes OOS')
      } else if( embedFormat.length < 8 ) {
        embed.addField('Stock Levels', embedFormat.join(''))
      } else {
        const first = embedFormat.slice(0, Math.round(embedFormat.length / 2)).join('')
        const second = embedFormat.slice(Math.round(embedFormat.length / 2), embedFormat.length).join('')
        embed.addFields(
          { name: 'Stock Levels', value: first, inline: true },
          { name: '\u200b', value: second, inline: true },
        )
      }
      await interaction.reply({embeds: [embed]})
    })
  }
}